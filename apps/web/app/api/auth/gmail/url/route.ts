import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthorizationUrl } from "@/lib/delivery/gmail-oauth";

export async function GET(req: NextRequest) {
  try {
    const redirectUri = req.nextUrl.searchParams.get("redirectUri") || undefined;
    const authUrl = getGmailAuthorizationUrl(redirectUri);

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate Gmail OAuth URL",
      },
      { status: 500 }
    );
  }
}
