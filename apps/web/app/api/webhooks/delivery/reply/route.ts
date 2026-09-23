import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { getAiProvider } from "@leadintel/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, fromEmail, rawText, subject } = body;

    if (!messageId || !rawText) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: messageId and rawText are required." },
        { status: 400 }
      );
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { company: true, contact: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Referenced message not found." }, { status: 404 });
    }

    // Classify reply intent using Rule Engine
    const aiProvider = getAiProvider();
    const classification = await aiProvider.classifyReply(rawText);

    // Save reply and update state in a single transaction (no auto-response)
    const replyRecord = await prisma.$transaction(async (tx) => {
      const rep = await tx.reply.create({
        data: {
          messageId: message.id,
          contactId: message.contactId,
          classification: classification.classification,
          sentiment: classification.sentiment,
          rawText,
          handled: false,
          handledNotes: `Auto-classified: ${classification.reasoning}`,
        },
      });

      await tx.message.update({
        where: { id: message.id },
        data: { status: "REPLIED" },
      });

      await tx.messageEvent.create({
        data: {
          messageId: message.id,
          eventType: "REPLY_RECEIVED",
          metadata: {
            fromEmail,
            classification: classification.classification,
            sentiment: classification.sentiment,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: "REPLY_RECEIVED",
          actor: "REPLY_WEBHOOK",
          details: {
            replyId: rep.id,
            from: fromEmail,
            classification: classification.classification,
          },
        },
      });

      // If reply is an opt-out, automatically add to suppressions
      if (classification.classification === "OPT_OUT") {
        if (fromEmail) {
          await tx.suppression.upsert({
            where: { email: fromEmail.toLowerCase().trim() },
            create: {
              email: fromEmail.toLowerCase().trim(),
              reason: "UNSUBSCRIBE",
              source: "REPLY_OPT_OUT",
            },
            update: { reason: "UNSUBSCRIBE" },
          });
        }
      }

      return rep;
    });

    return NextResponse.json({
      success: true,
      data: {
        replyId: replyRecord.id,
        classification: classification.classification,
        sentiment: classification.sentiment,
        reasoning: classification.reasoning,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to ingest reply" },
      { status: 500 }
    );
  }
}
