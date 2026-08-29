import { dot, ev, type Vec2, vec2, vec2Schema, vecLength } from "@common";
import z from "zod";
import { SATCollider } from "./collision";

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
	rotation: z.number()
});
const baseCollider = transformSchema.extend({
	offet: vec2Schema,
});
const boxCollider = baseCollider.extend({
	type: z.literal("box"),
	width: z.number().nonnegative(),
	height: z.number().nonnegative()
});
const circleCollider = baseCollider.extend({
	type: z.literal("circle"),
	radius: z.number().nonnegative(),
});
const polygonCollider = baseCollider.extend({
	type: z.literal("polygon"),
	points: z.array(vec2Schema).min(3),

});
const colliderSchema = z.discriminatedUnion("type", [
	boxCollider, 
	circleCollider,
	polygonCollider
]);

type Circle = z.infer<typeof circleCollider>;
type Box = z.infer<typeof boxCollider>;
type Polygon = z.infer<typeof polygonCollider>;

export type Collider = z.infer<typeof colliderSchema>;

function collide(a: Collider, b: Collider) {
	main: switch (a.type) {
		case "box": switch (b.type) {
			case "box": break main
			case "circle":return collideCircleBox(b, a);
			case "polygon":break main
		}
		case "circle": switch (b.type) {

			case "box":return collideCircleBox(a, b);
			case "circle":return collideCircleCircle(a, b);
			case "polygon":break main
		}
		case "polygon": switch (b.type) {

			case "box":break main
			case "circle":break main
			case "polygon":break main
		}
	}
	// const t = `${a.type}-${b.type}` as const;
	// if (t === "circle-circle" ) {
	// 	// whatever dude someone should submit a pr to typescript that fixes ts
	// 	// this should totally narrow a string union but it doesn't
	// 	return collideCircleCircle(a, b);
	// }
	// switch(t) {
	// 	case "circle-circle":
	// 	case "circle-box":
	// 		return collideCircleBox(a, b);
	// 	case "box-circle":
	// 		return collideCircleBox(b, a);
	// 	case "circle-polygon":

	// 	default:
	// 	}
		throw "I cannot deal with you TOUCHING right now 🤮"
}

function collideCircleCircle<C extends Extract<Collider, {type: "circle"}>>(a: C, b: Circle) {}
function collideCircleBox(a: Circle, b: Box) {}





// Get the ratio of p1 on the line to point 2
// assumes points are on the same line
export const isP2FurtherPoint = (p1: Vec2, p2: Vec2, axis: Vec2): boolean => {
	return dot(p1, axis) <= dot(p2, axis);
};

// https://dyn4j.org/20102010/01/sat/ <- algorithm to detect collisons in convex polygon
// Nolan is a roman
/** sats lover */
export const SATSolver = (
	collider1: SATCollider,
	collider2: SATCollider,
): [isColliding: boolean, overlapAmount: number, direction: Vec2] => {
	// const corners1 = polygonCollider1.getCorners()
	// const corners2 = polygonCollider2.getCorners()
	// getEdges(corners1)
	// getEdges(corners2)

	// The normals of the Shape
	const axes = [...collider1.getAxes(collider2), ...collider2.getAxes(collider1)];

	let smallestOverlapAmount = Infinity;
	let mtvAxis = axes[0];

	let check = 0;
	// console.log(axes)

	for (const axis of axes) {
		// console.log(check, axis)
		check++;
		// const [start_1, end_1] = projShape(corners1, axis)
		// const [start_2, end_2] = projShape(corners2, axis)
		const [start_1, end_1] = collider1.projShape(axis);
		const [start_2, end_2] = collider2.projShape(axis);

		//check non overlap in projects
		// if one axis has two projections that don't overlap, then garenteed to not collide!
		// !(start_1 <= end_2 && start_2 <= end_1) <- if something doesn't overlap
		const start1_less_end2 = isP2FurtherPoint(start_1, end_2, axis);
		const start2_less_end1 = isP2FurtherPoint(start_2, end_1, axis);

		if (!(start1_less_end2 && start2_less_end1)) {
			// console.log(start1_less_end2, start_1, end_1, start2_less_end1, start_2, end_2)
			// console.log(start1_less_end2, start_1, end_2, start2_less_end1, start_2, end_1)
			return [false, 0, vec2(0, 0)];
		} else {
			const overlapAmount = Math.min(vecLength(ev`${start_2} - ${end_1}`), vecLength(ev`${start_1} - ${end_2}`));

			if (overlapAmount < smallestOverlapAmount) {
				smallestOverlapAmount = overlapAmount;
				mtvAxis = axis;
			}
		}
	}

	//TODO redo this to retrofit the logic
	// Force two things to bonuce off each other
	if (isP2FurtherPoint(collider1.center, collider2.center, mtvAxis)) {
		smallestOverlapAmount *= -1;
	}

	return [true, smallestOverlapAmount, mtvAxis];
};