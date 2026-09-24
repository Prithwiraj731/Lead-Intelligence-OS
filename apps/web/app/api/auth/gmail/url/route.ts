import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthorizationUrl } from "@/lib/delivery/gmail-oauth";

export async function GET(req: NextRequest) {
  try {
    const redirectUri = req.nextUrl.searchParams.get("redirectUri") || undefined;
    const returnTo = req.nextUrl.searchParams.get("returnTo") || undefined;
    const authUrl = getGmailAuthorizationUrl(redirectUri, returnTo);

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
