import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
    time: new Date().toISOString(),
  });
}
