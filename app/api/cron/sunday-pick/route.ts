import { NextResponse } from "next/server";
import { compose } from "@/src/composition";
import { sundayPick } from "@application/sundayPick";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const deps = compose();
  const lesson = await sundayPick(deps);
  return NextResponse.json({ data: lesson });
}
