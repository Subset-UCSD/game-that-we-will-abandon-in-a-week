import z from "zod";
import { vec2Schema } from "./vector";

/**
 * This is a rework/port/cleanup of the work Sean did in collision.ts that
 * replaces collision done with rich classes with dumb collision objects
 * that can be stored directly on game objects and passed to a collide
 * function within this file that knows how to collide those two things
 */

/**
 * Methodology here is that colliders are very dumb, they are just plain
 * JS objects. We have a function `collide` that takes in two objects and
 * it knows how to collide them.
 */
// nick: I intend for transform schema values to be spread onto the collider when
// preparing the object to pass to collide(), but implementation can vary ig
const transformSchema = z.object({
	position: vec2Schema,
	rotation: z.number(),
});
const baseCollider = transformSchema.extend({
	offset: vec2Schema,
});
const boxCollider = baseCollider.extend({
	type: z.literal("box"),
	width: z.number().nonnegative(),
	height: z.number().nonnegative(),
});
const circleCollider = baseCollider.extend({
	type: z.literal("circle"),
	radius: z.number().nonnegative(),
});
const polygonCollider = baseCollider.extend({
	type: z.literal("polygon"),
	corners: z.array(vec2Schema).min(3),
});
export const colliderSchema = z.discriminatedUnion("type", [boxCollider, circleCollider, polygonCollider]);

// make sure colliderSchema
// console.log('testing colliderSchema in common/colliders.ts!')
// z.safeParse(colliderSchema,{type:'box',position:{x:0,y:0},rotation:0,offset:{x:0,y:0,},width:1,height:1,})

export type CircleCollider = z.infer<typeof circleCollider>;
export type BoxCollider = z.infer<typeof boxCollider>;
export type PolygonCollider = z.infer<typeof polygonCollider>;

export type Collider = z.infer<typeof colliderSchema>;
