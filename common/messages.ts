import { Inputs, inputSchema } from "@common/input";
import { wholeFkingGameState } from "@common/game";
import z from "zod";
import { sessionIdSchema } from "./session";

/**
 * Message schema helper. This returns a zod schema for message shape with a payload
 * @param name The literal name of the message
 * @param value The Zod schema that defines the shape of your message's payload
 * @returns 
 */
function $message<Type extends string, Payload extends z.ZodType>(name: Type, value: Payload) {
	return z.object({
		type: z.literal(name),
		value
	});
}

// ================== BEGIN CLIENT-SENT MESSAGE SCHEMAS ==================================

export const inputMessage = $message("input", inputSchema);
export type InputMessage = z.infer<typeof inputMessage>;

export const joinMessage = $message("join", z.object({
	sessionId: sessionIdSchema.optional()
}));
export type JoinMessage = z.infer<typeof joinMessage>;

export const clientMessage = z.union([
	inputMessage,
	joinMessage
]);
export type ClientMessage = z.infer<typeof clientMessage>;

// ================== BEGIN SERVER-SENT MESSAGE SCHEMAS ==================================

export const wholeFkingGameStateMessage = $message("game-state", wholeFkingGameState);
export type WholeFkingGameStateMessage = z.infer<typeof wholeFkingGameStateMessage>;

export const joinResponse = $message("join-response", z.void());
export type JoinResponse = z.infer<typeof joinResponse>;

export const serverMessage = z.union([
	wholeFkingGameStateMessage,
	joinResponse
]);
export type ServerMessage = z.infer<typeof serverMessage>;


// Generalized message schema that includes all client and server messages
export const messageSchema = z.union([
	clientMessage, 
	serverMessage
]);
export type Message = z.infer<typeof messageSchema>;