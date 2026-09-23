import { NextResponse } from "next/server";
import { prisma } from "@leadintel/database";

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: { connected: false, latencyMs: 0 },
    n8n: { connected: false, url: process.env.N8N_BASE_URL || "http://localhost:5678" },
  };

  // Check PostgreSQL
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database.connected = true;
    status.database.latencyMs = Date.now() - dbStart;
  } catch (err: any) {
    status.database.connected = false;
  }

  // Check n8n
  try {
    const n8nRes = await fetch(`${status.n8n.url}/healthz`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (n8nRes.ok) {
      status.n8n.connected = true;
    }
  } catch {
    status.n8n.connected = false;
  }

  return NextResponse.json(status, {
    status: status.database.connected ? 200 : 503,
  });
}
