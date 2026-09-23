import { NextResponse } from "next/server";
import { getGmailOAuthStatus } from "@/lib/delivery/gmail-oauth";

export async function GET() {
  try {
    const status = getGmailOAuthStatus();

    // Ensure tokens are NEVER included in response
    return NextResponse.json({
      success: true,
      data: {
        connected: status.connected,
        email: status.email,
        provider: status.provider,
        connectedAt: status.connectedAt,
        scopes: status.scopes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve Gmail OAuth status",
      },
      { status: 500 }
    );
  }
}
