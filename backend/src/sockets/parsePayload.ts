import { Socket } from "socket.io";
import { ZodSchema, ZodError } from "zod";
import { emitError } from "./emit";

export function parsePayload<T>(
  socket: Socket,
  schema: ZodSchema<T>,
  raw: unknown
): T | null {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.errors.map((e) => e.message).join("; ");
    emitError(socket, `Invalid payload: ${msg}`);
    return null;
  }
  return result.data;
}
