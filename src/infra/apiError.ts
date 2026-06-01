import { NextResponse } from "next/server";
import { logger } from "./logger";

export interface ApiErrorBody {
  readonly error: string;
  readonly code: string;
  readonly requestId: string;
}

const randomId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const apiError = (
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiErrorBody> => {
  const requestId = randomId();
  logger.warn("api.error", { code, status, requestId, ...details });
  return NextResponse.json<ApiErrorBody>(
    { error: message, code, requestId },
    { status, headers: { "x-request-id": requestId } }
  );
};

export const handleUnexpected = (
  err: unknown,
  route: string
): NextResponse<ApiErrorBody> => {
  const requestId = randomId();
  const message = err instanceof Error ? err.message : String(err);
  logger.error("api.unexpected", { route, requestId, message });
  return NextResponse.json<ApiErrorBody>(
    { error: "internal error", code: "INTERNAL", requestId },
    { status: 500, headers: { "x-request-id": requestId } }
  );
};
