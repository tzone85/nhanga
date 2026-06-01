type Level = "info" | "warn" | "error";

const emit = (level: Level, event: string, ctx?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === "test") return;
  const payload = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...ctx
  });
  if (level === "error") process.stderr.write(payload + "\n");
  else process.stdout.write(payload + "\n");
};

export const logger = {
  info: (event: string, ctx?: Record<string, unknown>) => emit("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit("error", event, ctx)
};
