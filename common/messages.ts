import { wholeFkingGameState } from "@common/game";
import { inputSchema } from "@common/input";
import z from "zod";
import { tileSchema } from "./tiles";

/**
 * Message schema helper. This returns a zod schema for message shape with a payload
 * @param name The literal name of the message
 * @param value The Zod schema that defines the shape of your message's payload
 * cannot be undefined or void!!!
 * @returns
 */
function $message<Type extends string, Payload extends z.ZodType>(name: Type, value: Payload) {
	return z.object({
		type: z.literal(name),
		value,
	});
}

// ================== BEGIN CLIENT-SENT MESSAGE SCHEMAS ==================================

export const inputMessage = $message("input", inputSchema);
export type InputMessage = z.infer<typeof inputMessage>;

export const pleaseSendMeFullGameStateMessage = $message("please-send-full-game-state", z.null());

export const tileEditMessage = $message(
	"tile-edit",
	z.object({
		vecs: z.object({ x: z.number(), y: z.number() }).array(),
		tile: tileSchema.nullable(),
	}),
);

export const joinMessage = $message(
	"join",
	z.object({
		sessionId: z.string().optional(),
	}),
);
export type JoinMessage = z.infer<typeof joinMessage>;

export const clientMessage = z.discriminatedUnion("type", [
	inputMessage,
	pleaseSendMeFullGameStateMessage,
	tileEditMessage,
	joinMessage,
]);
export type ClientMessage = z.infer<typeof clientMessage>;

// ================== BEGIN SERVER-SENT MESSAGE SCHEMAS ==================================

export const wholeFkingGameStateMessage = $message(
	"game-state",
	z.object({
		gameState: wholeFkingGameState,
		versionId: z.string(),
	}),
);
export type WholeFkingGameStateMessage = z.infer<typeof wholeFkingGameStateMessage>;

export const partialFkingGameStateMessage = $message(
	"partial-game-state",
	z.object({
		gameState: z.unknown().optional(),
		keyState: z.string().array().optional(),
		expectedPreviousVersionId: z.string(),
		newVersionId: z.string(),
	}),
);
export type PartialFkingGameStateMessage = z.infer<typeof partialFkingGameStateMessage>;

const particleSchema = z.object({
	// hsl format
	color: z.tuple([z.number(), z.number(), z.number()]),
	count: z.number(),
	x: z.number(),
	y: z.number(),
	// TODO: how customizable do we want this to be
});
export type Particle = z.infer<typeof particleSchema>;

const particleMessage = $message("particles", particleSchema.array());

const soundSchema = z.object({
	name: z.string(),
	x: z.number(),
	y: z.number(),
	detectableDistance: z.number().optional(),
	volume: z.number().optional(),
	playbackRate: z.number().optional(),
})
export type SoundEvent = z.infer<typeof soundSchema>
const soundMessage = $message("sound", soundSchema);

export const joinResponse = $message(
	"join-response",
	z.object({
		sessionId: z.string(),
		playerId: z.number(),
	}),
);
export type JoinResponse = z.infer<typeof joinResponse>;

export const serverMessage = z.discriminatedUnion("type", [
	wholeFkingGameStateMessage,
	partialFkingGameStateMessage,
	particleMessage,
	soundMessage,
	joinResponse,
]);
export type ServerMessage = z.infer<typeof serverMessage>;

// Generalized message schema that includes all client and server messages
export const messageSchema = z.discriminatedUnion("type", [...clientMessage.options, ...serverMessage.options]);
export type Message = z.infer<typeof messageSchema>;
