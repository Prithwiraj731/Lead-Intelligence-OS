import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/delivery/gmail-oauth";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const state = req.nextUrl.searchParams.get("state");
    let returnTo = req.nextUrl.searchParams.get("returnTo") || "/pilot";
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        if (decoded.returnTo) returnTo = decoded.returnTo;
      } catch {}
    }

    if (error) {
      return NextResponse.redirect(
        new URL(`${returnTo}?oauth=error&message=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code" },
        { status: 400 }
      );
    }

    const { email } = await exchangeCodeForTokens(code);

    return NextResponse.redirect(
      new URL(`${returnTo}?oauth=success&email=${encodeURIComponent(email)}`, req.url)
    );
  } catch (error: any) {
    console.error("Gmail OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/pilot?oauth=error&message=${encodeURIComponent(error.message || "OAuth failed")}`, req.url)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, redirectUri } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code in body" },
        { status: 400 }
      );
    }

    const { email, connected } = await exchangeCodeForTokens(code, redirectUri);

    return NextResponse.json({
      success: true,
      connected,
      email,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to exchange OAuth code",
      },
      { status: 500 }
    );
  }
}
