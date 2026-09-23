import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function GET() {
  try {
    const suppressions = await prisma.suppression.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: suppressions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch suppressions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, domain, phone, reason = "MANUAL_SUPPRESSION", source = "USER" } = body;

    if (!email && !domain && !phone) {
      return NextResponse.json(
        { success: false, error: "At least one of email, domain, or phone is required." },
        { status: 400 }
      );
    }

    const suppression = await prisma.suppression.create({
      data: {
        email: email ? email.toLowerCase().trim() : null,
        domain: domain ? domain.toLowerCase().trim() : null,
        phone: phone ? phone.trim() : null,
        reason,
        source,
      },
    });

    return NextResponse.json({
      success: true,
      data: suppression,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create suppression" },
      { status: 500 }
    );
  }
}
