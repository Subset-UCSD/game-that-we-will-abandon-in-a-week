import type { Vec2 } from "@common";
import type { Collider } from "@server/collision";
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
	// type: z.string(),
	x: z.number(),
	y: z.number(),
});

const playerSchema = worldObjectSchema.extend({
	type: z.literal("player"),
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
	dialogue:z.object({
		messagfe:z.string(),
		options:z.object({
			text:z.string(),
			active:z.number().optional(),
		}).array(),
	}).optional(),
	// wtf is "collied"
	// like the dog ?
	// probably idk man, i'm not the one whose bat at spelling
	collied: z.boolean(),
});

const meatBallSchema = worldObjectSchema.extend({
	type: z.literal("meatball"),
	height: z.number(),
});

const explosionSchema = worldObjectSchema.extend({
	type: z.literal("explosion"),
	radius: z.number(),
});

const enemySchema = worldObjectSchema.extend({
	type: z.literal("enemy"),
	healthPoint:z.number(),
	healthPMax:z.number(),
});

const seedSchema = worldObjectSchema.extend({
	type: z.literal("seed"),
	growthStage: z.number(),
});

const thingSchema = worldObjectSchema.extend({
	type: z.literal("thing"),
	kind: z.literal(["tree", "campfire", "techbro"]),
	interactive: z.boolean().optional(),
	hp: z.number().optional(),
	maxHp: z.number().optional(),
});

const corpseSchema = worldObjectSchema.extend({ type: z.literal("corpse"), facingLeft: z.boolean() });

export const d20schema = z.strictObject({
	// probably should use worldObjectSchema
	type: z.literal("d20"),
	x: z.number(),
	y: z.number(),
	id: z.number(),
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

const allGameObjectSchemas = z.discriminatedUnion("type", [
	playerSchema,
	d20schema,
	meatBallSchema,
	explosionSchema,
	enemySchema,
	seedSchema,
	thingSchema,
	corpseSchema,
]);
export type SerializedGameObject = z.infer<typeof allGameObjectSchemas>;

export const wholeFkingGameState = z.object({
	gameObjects: z.array(allGameObjectSchemas),
	debugColliders: z.array(colliderSchema), //.optional(),
	tiles: chunkMapSchema,
});

z.object({
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
	id: number;
	partyId: string;
	shouldDelete: boolean;
	collider?: Collider;
	// onCollide?: (mts: Vec2, id:number, type:number) => void
	hasCollidedWith?(other: GameObject, sdmts: Vec2): void;
	tick(): void;
	serialize(): SerializedGameObject;
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
