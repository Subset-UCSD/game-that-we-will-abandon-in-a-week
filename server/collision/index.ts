import {
	type BoxCollider,
	type CircleCollider,
	type Collider,
	dot,
	ev,
	isZeroVec,
	normalize,
	ortho,
	type PolygonCollider,
	projVec,
	rotate,
	type Vec2,
	vec2,
	vecLength,
	vecLengthSquared,
} from "@common";
// import { error } from "console";

export function collide(a: Collider, b: Collider) {
	switch (a.type) {
		case "box":
			switch (b.type) {
				case "box":
					return collideBoxBox(a, b);
				case "circle":
					return collideCircleBox(b, a);
				case "polygon":
					return collideBoxPolygon(a, b);
			}
		case "circle":
			switch (b.type) {
				case "box":
					return collideCircleBox(a, b);
				case "circle":
					return collideCircleCircle(a, b);
				case "polygon":
					return collideCirclePolygon(a, b);
			}
		case "polygon":
			switch (b.type) {
				case "box":
					return collideBoxPolygon(b, a);
				case "circle":
					return collideCirclePolygon(b, a);
				case "polygon":
					return collidePolygonPolygon(a, b);
			}
	}
	throw "I cannot deal with you TOUCHING right now 🤮";
}

function collideBoxBox(a: BoxCollider, b: BoxCollider) {
	return collideAnythingAnything_SLOW(a, b);
}
function collideCircleCircle(a: CircleCollider, b: CircleCollider) {
	return collideAnythingAnything_SLOW(a, b);
}
function collideCircleBox(a: CircleCollider, b: BoxCollider) {
	return collideAnythingAnything_SLOW(a, b);
}
function collideCirclePolygon(a: CircleCollider, b: PolygonCollider) {
	return collideAnythingAnything_SLOW(a, b);
}
function collideBoxPolygon(a: BoxCollider, b: PolygonCollider) {
	return collideAnythingAnything_SLOW(a, b);
}
function collidePolygonPolygon(a: PolygonCollider, b: PolygonCollider) {
	return collideAnythingAnything_SLOW(a, b);
}

function getCorners(collider: Collider): Vec2[] {
	switch (collider.type) {
		case "box":
			const { position, width, height, rotation } = collider;
			return [
				rotate(position, vec2(position.x + width / 2, position.y + height / 2), rotation), //bottom right
				rotate(position, vec2(position.x - width / 2, position.y + height / 2), rotation), //bottom left
				rotate(position, vec2(position.x - width / 2, position.y - height / 2), rotation), //top left
				rotate(position, vec2(position.x + width / 2, position.y - height / 2), rotation), //top right
			];
		case "circle":
		// bro what corners
		case "polygon":
		// easy
	}

	throw Error("How did you fuck up getCorners");
}

function getAxes(a: Collider, reference: Collider): Vec2[] {
	switch (a.type) {
		case "circle":
			return [normalize(ev`${a.position} + ${a.offset} - ${reference.position} - ${reference.offset}`)];
		case "box":
			// https://www.desmos.com/calculator/l8k5red0mg
			const cos = Math.cos(a.rotation);
			const sin = Math.sin(a.rotation);
			return [vec2(sin, cos), vec2(cos, -sin)];
		case "polygon":
			// go through all edges, get their normals
			const vec_list = a.corners;
			const axes: Vec2[] = [];
			for (let i = 0; i < vec_list.length; i++) {
				const p1 = vec_list[i];
				const p2 = vec_list[i + 1 < vec_list.length ? i + 1 : 0];
				axes.push(normalize(ortho(ev`${p1} - ${p2}`)));
			}
			return axes;
	}
}

function projShape(collider: Collider, axis: Vec2) {
	switch (collider.type) {
		case "box":
			const corners = getCorners(collider);
			// each of these points are on the line of the axis at the origin
			let startPoint: Vec2 = projVec(corners[0], axis);
			let endPoint: Vec2 = projVec(corners[1], axis);

			for (const corner of corners.slice(2)) {
				const testPoint = projVec(corner, axis);
				if (isP2FurtherPoint(testPoint, startPoint, axis)) startPoint = testPoint;

				if (!isP2FurtherPoint(testPoint, endPoint, axis)) endPoint = testPoint;
			}
			return [startPoint, endPoint];
		case "circle":
			const { position, rotation, offset } = collider;
			return [
				ev`${position} + ${offset} - (${axis} * ${rotation})`,
				ev`${position} + ${offset} + (${axis} * ${rotation})`,
			];
		case "polygon":
			throw new Error(`ts is TOUGH`);
	}
}

/**
 * Collide anything with anything using SAT assuming it is:
 * a) convex shape
 * b) has edges
 * problem: this is SLOW, so prefer more specialized collision first
 * before using this
 */
function collideAnythingAnything_SLOW(a: Collider, b: Collider) {
	return SATSolver(a, b);
}

// Get the ratio of p1 on the line to point 2
// assumes points are on the same line
export const isP2FurtherPoint = (p1: Vec2, p2: Vec2, axis: Vec2): boolean => {
	return dot(p1, axis) <= dot(p2, axis);
};

// https://dyn4j.org/20102010/01/sat/ <- algorithm to detect collisons in convex polygon
// Nolan is a roman
/** sats lover */
export const SATSolver = (
	collider1: Collider,
	collider2: Collider,
): [isColliding: boolean, overlapAmount: number, direction: Vec2] => {
	// The normals of the Shape
	const axes = [...getAxes(collider1, collider2), ...getAxes(collider2, collider1)];

	let smallestOverlapAmount = Infinity;
	let mtvAxis = axes[0];

	let check = 0;
	// console.log(axes)

	for (const axis of axes) {
		// console.log(check, axis)
		check++;
		// const [start_1, end_1] = projShape(corners1, axis)
		// const [start_2, end_2] = projShape(corners2, axis)
		const [start_1, end_1] = projShape(collider1, axis);
		const [start_2, end_2] = projShape(collider2, axis);

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
	if (isP2FurtherPoint(collider1.position, collider2.position, mtvAxis)) {
		smallestOverlapAmount *= -1;
	}

	return [true, smallestOverlapAmount, mtvAxis];
};

export function isInsideMe(point: Vec2, collider: Collider): boolean {
	// am i supposed to add offset
	const sum = ev`${collider.position} + ${collider.offset}`;
	switch (collider.type) {
		case "box":
			// TODO: rotation
			if (collider.rotation !== 0) throw new Error("nonzero rotation  not supported");
			return (
				sum.x - collider.width / 2 <= point.x &&
				point.x <= sum.x + collider.width / 2 &&
				sum.y - collider.height / 2 <= point.y &&
				point.y <= sum.y + collider.height / 2
			);
		// is point inside of box
		case "circle":
			// is point inside of circle
			// TODO: is offset after or before rotation
			if (collider.rotation !== 0 && !isZeroVec(collider.offset))
				throw new Error("nonzero rotation  not supported when combine with nonzero offset");
			return vecLengthSquared(ev`${sum} - ${point}`) <= collider.radius * collider.radius;
		case "polygon":
			// is point inside of polygon
			throw new Error("unimplemented polygon");
	}
}
