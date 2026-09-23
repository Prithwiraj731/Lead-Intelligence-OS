import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";
import { evaluateMessageQuality } from "@leadintel/ai";
import { z } from "zod";

const EditMessageBodySchema = z.object({
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  whatsappBody: z.string().optional(),
  followupBody: z.string().optional(),
  callToAction: z.string().optional(),
  approveAfterEdit: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = EditMessageBodySchema.parse(body);

    const message = await prisma.message.findUnique({
      where: { id },
      include: { company: true, opportunity: { include: { service: true } } },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const emailSubject = parsed.emailSubject !== undefined ? parsed.emailSubject : message.emailSubject || "";
    const emailBody = parsed.emailBody !== undefined ? parsed.emailBody : message.emailBody || "";
    const whatsappBody = parsed.whatsappBody !== undefined ? parsed.whatsappBody : message.whatsappBody || "";
    const followupBody = parsed.followupBody !== undefined ? parsed.followupBody : message.followupBody || "";
    const callToAction = parsed.callToAction !== undefined ? parsed.callToAction : message.callToAction || "";

    // Re-evaluate quality on edited content
    const qualityReport = evaluateMessageQuality({
      companyName: message.company.name,
      emailSubject,
      emailBody,
      whatsappBody,
      callToAction,
      evidenceUsed: (message.evidenceUsed as string[]) || [],
      primaryPainPoint: message.opportunity?.primaryPainPoint || "",
      recommendedService: message.opportunity?.service?.name || "",
    });

    const updated = await prisma.$transaction(async (tx) => {
      const targetStatus = parsed.approveAfterEdit ? "APPROVED" : "EDITED";

      const msg = await tx.message.update({
        where: { id },
        data: {
          emailSubject,
          emailBody,
          whatsappBody,
          followupBody,
          callToAction,
          qualityScore: qualityReport.overallScore,
          qualityReport: qualityReport as any,
          status: targetStatus,
          ...(parsed.approveAfterEdit
            ? {
                approvedBy: "USER",
                approvalNotes: parsed.notes || "Edited and approved via Command Deck",
                approvedAt: new Date(),
              }
            : {}),
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: id,
          eventType: targetStatus,
          metadata: {
            actor: "USER",
            qualityScore: qualityReport.overallScore,
            editedFields: {
              emailSubject: parsed.emailSubject !== undefined,
              emailBody: parsed.emailBody !== undefined,
              whatsappBody: parsed.whatsappBody !== undefined,
            },
          },
        },
      });

      if (parsed.approveAfterEdit) {
        await tx.company.update({
          where: { id: message.companyId },
          data: { status: "OUTREACH_APPROVED" },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: parsed.approveAfterEdit ? "MESSAGE_APPROVED" : "MESSAGE_EDITED",
          actor: "USER",
          details: { messageId: id, manualEdit: true, qualityScore: qualityReport.overallScore },
        },
      });

      return msg;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Edit message error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to edit message" },
      { status: 400 }
    );
  }
}
