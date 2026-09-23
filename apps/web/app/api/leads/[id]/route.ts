import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        research: true,
        opportunities: {
          orderBy: { createdAt: "desc" },
          include: { service: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          include: {
            contact: true,
            opportunity: { include: { service: true } },
            events: { orderBy: { createdAt: "desc" } },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error("Get lead details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lead profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(json.notes !== undefined ? { notes: json.notes } : {}),
        ...(json.status ? { status: json.status } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 400 }
    );
  }
}
