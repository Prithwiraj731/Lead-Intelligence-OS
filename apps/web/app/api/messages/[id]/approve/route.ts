import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const approvalNotes = body.notes || "Approved via Command Center review";

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
          status: "APPROVED",
          approvedBy: "USER",
          approvalNotes,
          approvedAt: new Date(),
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: id,
          eventType: "APPROVED",
          metadata: {
            actor: "USER",
            approvedAt: new Date().toISOString(),
            notes: approvalNotes,
          },
        },
      });

      await tx.company.update({
        where: { id: message.companyId },
        data: { status: "OUTREACH_APPROVED" },
      });

      await tx.auditLog.create({
        data: {
          companyId: message.companyId,
          action: "MESSAGE_APPROVED",
          actor: "USER",
          details: { messageId: id, channel: msg.channel },
        },
      });

      return msg;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Approve message error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve message" },
      { status: 500 }
    );
  }
}
