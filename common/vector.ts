export type Vec2 = { x: number, y: number };

export type Vec3 = { x: number, y: number, z: number};

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });


export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const vec3ToDomPoint = (v: Vec3) => (new DOMPoint(v.x, v.y, v.z))
export const DomPointToVec3 = (v: DOMPoint) => (vec3(v.x, v.y, v.z))


//2D Vector Opertations
export const isVecEq = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y

export const addVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scaleVec = ({ x, y }: Vec2, scale: number): Vec2 => ({ x: x * scale, y: y * scale });

export const vecLength = ({ x, y }: Vec2): number => Math.hypot(x, y)
/** more efficient to compute than the length, good for comparing distances */
export const vecLengthSquared = ({ x, y }: Vec2): number => x * x + y * y;

export const normalize = (v: Vec2): Vec2 => scaleVec(v, 1/vecLength(v));

export const ortho =  ({ x, y }: Vec2): Vec2 => vec2(-y, x);

// let it be known:
//   the produce was once
//     a.x*b.x + a.y+b.y
//   then it was changed to
//     a.x*b.x + b.y*b.y
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y 

/**
 * rotates `point` `radians` radians *clockwise* about `axis`
 */
export const rotate = (axis: Vec2, point: Vec2, radians: number) => {
	const translated_point = subVec(axis, point);
	const point_prime = vec2(
		translated_point.x * Math.cos(radians) - translated_point.y * Math.sin(radians),
		translated_point.x * Math.sin(radians) + translated_point.y * Math.cos(radians)
	)
	return addVec(axis, point_prime)
}


// 3D Vector Operations
export const cross_product = (a: Vec3, b:Vec3) => {
	return vec3(
		a.y * b.z - a.z * b.y,
		a.z * b.x - a.x * b.z,
		a.x * b.y - a.y * b.x
	)
}

export const subVec3 = (a: Vec3, b:Vec3) => {
	return vec3(
		a.x - b.x,
		a.y - b.y,
		a.z - b.z,
	)
}
