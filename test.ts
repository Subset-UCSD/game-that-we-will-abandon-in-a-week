import z from "zod";

export const vec2Schema = z.object({
	x: z.number(),
	y: z.number(),
});

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
console.log("testing colliderSchema in common/colliders.ts!");
z.safeParse(colliderSchema, {
	type: "box",
	position: { x: 0, y: 0 },
	rotation: 0,
	offset: { x: 0, y: 0 },
	width: 1,
	height: 1,
});
