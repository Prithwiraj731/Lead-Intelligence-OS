import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/delivery/gmail-oauth";

export async function POST() {
  try {
    disconnectGmail();

    return NextResponse.json({
      success: true,
      message: "Gmail account disconnected successfully. OAuth credentials cleared server-side.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to disconnect Gmail",
      },
      { status: 500 }
    );
  }
}
