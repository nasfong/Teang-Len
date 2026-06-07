type Level = "info" | "warn" | "error";

function log(level: Level, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    console[level](base, meta);
  } else {
    console[level](base);
  }
}

export const logger = {
  info:  (msg: string, meta?: unknown) => log("info",  msg, meta),
  warn:  (msg: string, meta?: unknown) => log("warn",  msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
