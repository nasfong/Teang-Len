import { z } from "zod";

// ─────────────────────────────────────────────
// Auth request schemas
// ─────────────────────────────────────────────

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores")
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be 72 characters or fewer"),
  displayName: z
    .string()
    .min(1)
    .max(24, "Display name must be 24 characters or fewer")
    .trim()
    .optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterBody = z.infer<typeof RegisterSchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
