import { Inputs, inputSchema } from "@common/input";
import { wholeFkingGameState } from "@common/game";
import z from "zod";

/**
 * Massage schema helper. This returns a zod schema for massage shape with a payload
 * @param name The literal name of the massage
 * @param value The Zod schema that defines the shape of your massage's payload
 * cannot be undefined or void!!!
 * @returns 
 */
function $massage<Type extends string, Payload extends z.ZodType>(name: Type, value: Payload) {
	return z.object({
		type: z.literal(name),
		value
	});
}

// ================== BEGIN CLIENT-SENT MASSAGE SCHEMAS ==================================

export const inputMassage = $massage("input", inputSchema);
export type InputMassage = z.infer<typeof inputMassage>;

export const joinMassage = $massage("join", z.object({
	sessionId: z.string().optional()
}));
export type JoinMassage = z.infer<typeof joinMassage>;

export const clientMassage = z.discriminatedUnion('type',[
	inputMassage,
	joinMassage
]);
export type ClientMassage = z.infer<typeof clientMassage>;

// ================== BEGIN SERVER-SENT MASSAGE SCHEMAS ==================================

export const wholeFkingGameStateMassage = $massage("game-state", wholeFkingGameState);
export type WholeFkingGameStateMassage = z.infer<typeof wholeFkingGameStateMassage>;

export const joinResponse = $massage("join-response", z.object({
	sessionId: z.string(),
	playerId: z.number()
}));
export type JoinResponse = z.infer<typeof joinResponse>;

export const serverMassage = z.discriminatedUnion('type',[
	wholeFkingGameStateMassage,
	joinResponse
]);
export type ServerMassage = z.infer<typeof serverMassage>;


// Generalized massage schema that includes all client and server massages
export const massageSchema = z.discriminatedUnion('type',[
	...clientMassage.options, 
	...serverMassage.options
]);
export type Massage = z.infer<typeof massageSchema>;