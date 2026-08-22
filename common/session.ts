import z from "zod";

export const SESSION_KEY_NUM_BYTES = 32;

export const sessionIdSchema = z.string().regex(new RegExp(`^[0-9a-f]{${SESSION_KEY_NUM_BYTES*2}}$`));
export type SessionId = z.infer<typeof sessionIdSchema>;