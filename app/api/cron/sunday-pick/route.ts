import { NextResponse } from "next/server";
import { compose } from "@/src/composition";
import { sundayPick } from "@application/sundayPick";
import { isAuthorisedCron } from "@infra/auth.cron";
import { apiError, handleUnexpected } from "@infra/apiError";

export async function GET(req: Request) {
  if (!isAuthorisedCron(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return apiError("UNAUTHORIZED", "unauthorized", 401);
  }
  try {
    const deps = compose();
    const lesson = await sundayPick(deps);
    return NextResponse.json({ data: lesson });
  } catch (err) {
    return handleUnexpected(err, "cron.sunday-pick");
  }
}
