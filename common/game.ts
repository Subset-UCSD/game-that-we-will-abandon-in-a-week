import { Collider } from "@server/collision";
import z from "zod";
import { chunkMapSchema } from "./tiles";

export const playerIdSchema = z.number();

const vec2Schema = z.object({ x: z.number(), y: z.number() })

const lineSchema = z.object({
  start: vec2Schema,
  end: vec2Schema,
  age: z.number().nullable(),
})
export type Line = z.infer<typeof lineSchema>

export const KNIFE_OFFSET_Y = -20

export const playerSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  x_vel: z.number(),
  y_vel: z.number(),
  roomId: z.string(),
  facingLeft:z.boolean(),
  baaing: z.string(),
  connected: z.boolean(),
  timeSinceLastInput:z.number(),
  healthpercent: z.number(),
  thought: z.string(),
  maxHp: z.number(),
  lines: z.array(lineSchema),
  canInteractWith: z.number().array(),
  knifeRadius: z.number(),
  knifeAngle: z.number(),
  // wtf is "collied"
  // like the dog ?
  collied: z.boolean()
});
export type Player = z.infer<typeof playerSchema>;


export const meatBallSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  height: z.number()
});
export type MeatBall = z.infer<typeof meatBallSchema>;

export const explosionSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  radius: z.number()
});
export type Explosion = z.infer<typeof explosionSchema>;

export const seedSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  growthStage: z.number()
});
export type Seed = z.infer<typeof seedSchema>;

export const thingSchema = z.strictObject({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  type: z.literal(['tree','campfire','techbro']),
  interactive: z.boolean().optional(),
  hp: z.number().optional(),
  maxHp: z.number().optional(),
})
export type SerializedThing = z.infer<typeof thingSchema>;


export const corpseSchema = z.strictObject({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  facingLeft:z.boolean(),
})
export type SerializedCorpse = z.infer<typeof corpseSchema>;

export const d20schema = z.strictObject({
  x: z.number(),
  y: z.number(),
  x_vel: z.number(),
  y_vel: z.number(),
  radius: z.number(),
  value: z.number(),
})
export type D20Schema = z.infer<typeof d20schema>;


const colliderSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('box'),x:z.number(),y:z.number(),width:z.number(),height:z.number()}),
  z.object({type:z.literal('circle'),x:z.number(),y:z.number(),radius:z.number()}),
  z.object({type:z.literal('capsule'),x:z.number(),y:z.number(),width:z.number(),height:z.number()}),
])
export type SerializedCollider = z.infer<typeof colliderSchema>


export const wholeFkingGameState = z.object({
	players: z.array(playerSchema),
  meatballs: z.array(meatBallSchema),
  explosions: z.array(explosionSchema),
  things: z.array(thingSchema),
  corpses: z.array(corpseSchema),
  seeds: z.array(seedSchema),
  d20:  z.array(d20schema),
  colliders: z.array(colliderSchema),//.optional(),
  tiles: chunkMapSchema,
  // add to this when you want the client to know more about the game
});
export type WholeFkingGameState = z.infer<typeof wholeFkingGameState>;

export interface GameObject {
  shouldDelete: boolean;
  collider?: Collider
  tick(): void;
  serialize(): unknown;
}



