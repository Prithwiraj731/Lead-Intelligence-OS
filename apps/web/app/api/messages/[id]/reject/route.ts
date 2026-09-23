import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Skipped by reviewer";

    const message = await prisma.message.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvalNotes: reason,
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: id,
          eventType: "REJECTED",
          metadata: { actor: "USER", reason },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: "MESSAGE_REJECTED",
          actor: "USER",
          details: { messageId: id, reason },
        },
      });

      return msg;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reject message" },
      { status: 500 }
    );
  }
}
