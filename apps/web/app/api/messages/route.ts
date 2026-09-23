import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "READY_FOR_REVIEW";

    const messages = await prisma.message.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: { id: true, name: true, domain: true, industry: true, location: true },
        },
        contact: true,
        opportunity: { include: { service: true } },
        events: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
