import { Collider } from "@server/collision";
import z from "zod";
import { chunkMapSchema } from "./tiles";

const idSchema = z.number();

const vec2Schema = z.object({ x: z.number(), y: z.number() });

const lineSchema = z.object({
	start: vec2Schema,
	end: vec2Schema,
	age: z.number().nullable(),
});

export const KNIFE_OFFSET_Y = -20;

// objects in the world have a position and id
const worldObjectSchema = z.object({
	id: idSchema,
	x: z.number(),
	y: z.number(),
});

const playerSchema = worldObjectSchema.and(
	z.object({
		x_vel: z.number(),
		y_vel: z.number(),
		roomId: z.string(),
		facingLeft: z.boolean(),
		baaing: z.string(),
		connected: z.boolean(),
		probablyafk: z.boolean(),
		healthpercent: z.number(),
		thought: z.string(),
		maxHp: z.number(),
		lines: z.array(lineSchema),
		canInteractWith: z.number().array(),
		knifeRadius: z.number(),
		knifeAngle: z.number(),
		// wtf is "collied"
		// like the dog ?
		// probably idk man, i'm not the one whose bat at spelling
		collied: z.boolean(),
	}),
);

const meatBallSchema = worldObjectSchema.and(z.object({ height: z.number() }));

const explosionSchema = worldObjectSchema.and(z.object({ radius: z.number() }));

const enemySchema = worldObjectSchema;

const seedSchema = worldObjectSchema.and(z.object({ growthStage: z.number() }));

const thingSchema = worldObjectSchema.and(
	z.object({
		type: z.literal(["tree", "campfire", "techbro"]),
		interactive: z.boolean().optional(),
		hp: z.number().optional(),
		maxHp: z.number().optional(),
	}),
);

const corpseSchema = worldObjectSchema.and(z.object({ facingLeft: z.boolean() }));

export const d20schema = z.strictObject({
  // probably should use worldObjectSchema
	x: z.number(),
	y: z.number(),
	x_vel: z.number(),
	y_vel: z.number(),
	radius: z.number(),
	value: z.number(),
});

const colliderSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("box"), x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
	z.object({ type: z.literal("circle"), x: z.number(), y: z.number(), radius: z.number() }),
	z.object({ type: z.literal("capsule"), x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
]);

export const wholeFkingGameState = z.object({
	players: z.array(playerSchema),
	meatballs: z.array(meatBallSchema),
	explosions: z.array(explosionSchema),
	things: z.array(thingSchema),
	corpses: z.array(corpseSchema),
	seeds: z.array(seedSchema),
	d20: z.array(d20schema),
	colliders: z.array(colliderSchema), //.optional(),
	tiles: chunkMapSchema,
	// add to this when you want the client to know more about the game
});


export interface GameObject {
	shouldDelete: boolean;
	collider?: Collider;
	tick(): void;
	serialize(): unknown;
}

export type SerializedThing = z.infer<typeof thingSchema>;
export type SerializedCorpse = z.infer<typeof corpseSchema>;
export type D20Schema = z.infer<typeof d20schema>;
export type Line = z.infer<typeof lineSchema>;
export type Seed = z.infer<typeof seedSchema>;
export type Explosion = z.infer<typeof explosionSchema>;
export type MeatBall = z.infer<typeof meatBallSchema>;
export type Player = z.infer<typeof playerSchema>;
export type WholeFkingGameState = z.infer<typeof wholeFkingGameState>;
export type SerializedCollider = z.infer<typeof colliderSchema>;
export type Enemy = z.infer<typeof enemySchema>;