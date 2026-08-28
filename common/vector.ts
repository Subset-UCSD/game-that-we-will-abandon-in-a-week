import { type Expression, parse } from "./vector/expression_parser";

export type Vec2 = { x: number; y: number };

export type Vec3 = { x: number; y: number; z: number };

export const vec2 = (x = 0, y = x): Vec2 => ({ x, y });

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const vec3ToDomPoint = (v: Vec3) => new DOMPoint(v.x, v.y, v.z);
export const DomPointToVec3 = (v: DOMPoint) => vec3(v.x, v.y, v.z);

//2D Vector Opertations
export const isVecEq = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y;
export const isZeroVec = ({x,y}:Vec2) => x===0&&y===0

export const addVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scaleVec = ({ x, y }: Vec2, scale: number): Vec2 => ({ x: x * scale, y: y * scale });

export const vecLength = ({ x, y }: Vec2): number => Math.hypot(x, y);
/** more efficient to compute than the length, good for comparing distances */
export const vecLengthSquared = ({ x, y }: Vec2): number => x * x + y * y;

export const normalize = (v: Vec2): Vec2 => scaleVec(v, 1 / vecLength(v));

export const ortho = ({ x, y }: Vec2): Vec2 => vec2(-y, x);

export const vecMap1 = ({ x, y }: Vec2, mapFn: (n: number) => number): Vec2 => ({ x: mapFn(x), y: mapFn(y) });
export const vecMap2 = (a: Vec2, b: Vec2, mapFn: (a: number, b: number) => number): Vec2 => ({
	x: mapFn(a.x, b.x),
	y: mapFn(a.y, b.y),
});
export const vecMap3 = (a: Vec2, b: Vec2, c: Vec3, mapFn: (a: number, b: number, c: number) => number): Vec2 => ({
	x: mapFn(a.x, b.x, c.x),
	y: mapFn(a.y, b.y, c.y),
});

// find the 2 points on the projection that are in the shadow of the shape
export const projVec = (p: Vec2, axis: Vec2): Vec2 => {
	return ev`${axis} * (${p} . ${axis}) / (${axis} . ${axis})`;
};

/**
 * picks point in circle of radius 1, uniformly
 */
export function randomInCircle (): Vec2 {
	// marcelo algorithm
	const radius = Math.sqrt(Math.random())
	const angle = Math.random() * 2 * Math.PI
	return vec2(Math.cos(angle)*radius, Math.sin(angle)*radius)
}

export const pairwiseMultiply =(a: Vec2, b: Vec2): Vec2 => ({x:a.x*b.x , y: a.y*b.y})

/**
 * makes the length of `target` at most `max`
 */
export const clamp = (target: Vec2, max: number) => {
	const signs = {
		x: Math.sign(target.x),
		y: Math.sign(target.y),
	};

	const normalized = normalize(target);
	const magnitude = vecLength(target);
	if (magnitude < max) {
		return target;
	} else {
		return scaleVec(normalized, max);
	}
};

export const vecToArray = ({ x, y }: Vec2): [x: number, y: number] => [x, y];

// let it be known:
//   the produce was once
//     a.x*b.x + a.y+b.y
//   then it was changed to
//     a.x*b.x + b.y*b.y
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const distSq = (a: Vec2, b: Vec2): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const dist = (a: Vec2, b: Vec2): number => distSq(a, b) ** 0.5;

/**
 * rotates `point` `radians` radians *clockwise* about `axis`
 */
export const rotate = (axis: Vec2, point: Vec2, radians: number) => {
	const translated_point = subVec(axis, point);
	const point_prime = vec2(
		translated_point.x * Math.cos(radians) - translated_point.y * Math.sin(radians),
		translated_point.x * Math.sin(radians) + translated_point.y * Math.cos(radians),
	);
	return addVec(axis, point_prime);
};

// 3D Vector Operations
export const cross_product = (a: Vec3, b: Vec3) => {
	return vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
};

export const subVec3 = (a: Vec3, b: Vec3) => {
	return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
};

const cache = new WeakMap<TemplateStringsArray, Expression | null>();
/**
 * ev = eval vector expression
 * @throws when you are bad!!
 */
export function ev(parts: TemplateStringsArray, ...values: (Vec2 | number)[]): Vec2 {
	const result = ev_impl(parts, ...values);
	if (typeof result === "number") {
		throw new TypeError(`you somehow produced a number (${result})`);
	}
	return result;
}
export function evN(parts: TemplateStringsArray, ...values: (Vec2 | number)[]): number {
	const result = ev_impl(parts, ...values);
	if (typeof result !== "number") {
		throw new TypeError(`you somehow produced a NOT number (${result})`);
	}
	return result;
}

function ev_impl(parts: TemplateStringsArray, ...values: (Vec2 | number)[]): Vec2 | number {
	const parsed = cache.getOrInsertComputed(parts, () => {
		let fullString = "";
		for (const [i, part] of parts.entries()) {
			fullString += part;
			if (i < values.length) {
				fullString += `${i}&`;
			}
		}
		return parse(fullString);
	});
	if (!parsed) {
		throw new SyntaxError(`'${parsed}' is BAD expression`);
	}
	const result = evaluateExpression(values, parsed);
	return result;
}

function evaluateExpression(values: (Vec2 | number)[], expression: Expression): Vec2 | number {
	if ("op" in expression) {
		const a = evaluateExpression(values, expression.a);
		const b = evaluateExpression(values, expression.b);
		switch (expression.op) {
			case "+": {
				if (typeof a !== "number" && typeof b !== "number") {
					return addVec(a, b);
				}
				if (typeof a === "number" && typeof b === "number") {
					return a + b;
				}
				throw new Error("cannot add vector and number");
			}
			case "-": {
				if (typeof a !== "number" && typeof b !== "number") {
					return subVec(a, b);
				}
				if (typeof a === "number" && typeof b === "number") {
					return a - b;
				}
				throw new Error("cannot add vector and number");
			}
			case "*": {
				if (typeof a === "number" && typeof b === "number") {
					return a * b;
				}
				if (typeof a !== "number" && typeof b === "number") {
					return scaleVec(a, b);
				}
				if (typeof a === "number" && typeof b !== "number") {
					return scaleVec(b, a);
				}
				if (typeof a !== 'number' && typeof b!=='number') {
					return  pairwiseMultiply(a, b)
				}
				// throw new Error("cannot multiply vectors, too ambiguous");
			}
			case "/": {
				if (typeof a === "number" && typeof b === "number") {
					return a / b;
				}
				if (typeof a !== "number" && typeof b === "number") {
					return scaleVec(a, 1 / b);
				}
				if (typeof a === "number" && typeof b !== "number") {
					return scaleVec(b, 1 / a);
				}
				throw new Error("cannot divide vectors");
			}
			case ".": {
				if (typeof a !== "number" && typeof b !== "number") {
					return dot(a, b);
				}
				throw new Error("cannot dot anything but vectors");
			}
			case "@": {
				if (typeof a !== "number" && typeof b !== "number") {
					return distSq(a, b);
				}
				throw new Error("cannot dist anything but vectors");
			}
		}
	} else if ("value" in expression) {
		return expression.value;
	} else {
		return values[expression.reference];
	}
}
