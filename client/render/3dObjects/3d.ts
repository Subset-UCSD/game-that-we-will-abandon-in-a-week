/**
 * Inspired by https://www.charlespetzold.com/blog/2024/09/CubeWireFrame.js
 * and https://www.charlespetzold.com/blog/2024/09/Die3D.js
 */

import { cross_product, type D20Schema, DomPointToVec3, subVec3, type Vec3, vec3, vec3ToDomPoint } from "@common";
import type { Canvas } from "../canvas";
import type { RenderableObject } from "../render";

export const identity = new DOMMatrix();

// I can already feel the weight of my sins crawlling on my back for this one for introducting
// a method to handle 3d shapes in our 2d game engine

// Its gonna be great for D20s Trust
interface Renderable3DObject extends RenderableObject {
	vertrices: Vec3[];
	faces: number[][]; //triangle faces
	//unspoken rule of faces: the vertex at index 0, connects to index 1 and -1

	texture?(c: CanvasRenderingContext2D, face_idx: number): void;
}

class Polyhedron3D implements Renderable3DObject {
	get index() {
		return this.y;
	}
	vertrices: Vec3[];
	faces: number[][];
	x: number = 0;
	y: number = 0;
	x_vel: number = 0;
	y_vel: number = 0;

	rotateX: number = 30;
	rotateY: number = 45;
	rotateZ: number = 0;

	private autorotate: boolean;

	update(objState: D20Schema): void {
		// console.log(objState.x, this.x);
		this.x = objState.x;
		this.y = objState.y;

		this.x_vel = objState.x_vel;
		this.y_vel = objState.y_vel;
	}

	// shouldRemove(): boolean {
	//     // return false
	// }

	constructor(vertrices: Vec3[], faces: number[][], autorotate = false) {
		this.vertrices = vertrices;
		this.faces = faces;
		this.autorotate = autorotate;
	}

	// may need to become a input to the
	texture(ctx: CanvasRenderingContext2D, face_idx: number): void {
		// ctx.strokeStyle = "blue";
		ctx.font = "bold 0.4px serif";

		// // ctx.fillRect(0, 0, 0.75, 0.75)
		ctx.lineWidth = 0.01;
		// ctx.strokeStyle = "blue 0.1"
		// // ctx.beginPath();
		// ctx.moveTo(0, 1);
		// ctx.lineTo(1, 0);
		// ctx.lineTo(0, 0);
		// ctx.lineTo(0, 1);
		// // ctx.closePath();
		// ctx.stroke();

		// // the outline

		// ctx.strokeStyle = '#666666';
		// ctx.stroke();

		// // the fill color
		// ctx.fillStyle = "#FFCC00";
		// ctx.fill();

		ctx.fillStyle = "red";
		ctx.fillText((face_idx + 1).toString(), 0.2, 0.4);
	}

	applyTexture(ctx: CanvasRenderingContext2D, face_veterices: Vec3[], face_idx: number): void {
		ctx.save();
		const e = face_veterices[1].x;
		const f = face_veterices[1].y;
		const a = face_veterices[0].x - e;
		const b = face_veterices[0].y - f;
		const c = face_veterices[2].x - e;
		const d = face_veterices[2].y - f;

		const textureMatrix = new DOMMatrix([a, b, c, d, e, f]);

		// c.fillRect("red")
		ctx.setTransform(ctx.getTransform().multiply(textureMatrix));
		this.texture(ctx, face_idx);

		ctx.setTransform(identity);
		ctx.restore();
	}

	render({ c }: Canvas): void {
		c.save();
		c.lineWidth = 0.1;
		c.strokeStyle = "red";
		const matrix = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

		matrix.translateSelf(this.x, this.y + Math.sin(Date.now() / 800) * 2, 0);
		matrix.rotateSelf(this.rotateX, this.rotateY, this.rotateZ);
		matrix.scaleSelf(10, 10, 10);
		this.rotateX += 0.5 * this.x_vel;
		this.rotateY += 0.5 * this.y_vel;
		// for loading screen while connecitng to server
		if (this.autorotate) {
			this.rotateX += 0.1;
			this.rotateY -= 0.1;
		}
		// this.rotateZ--;

		//TEMP

		c.beginPath();
		let frist = true;
		let face_index = 0;
		for (const face of this.faces) {
			const face_veterices: Vec3[] = [];
			for (const vertexIdx of face) {
				const vertex = this.vertrices.at(vertexIdx);

				if (vertex == null) {
					continue;
				}

				face_veterices.push(DomPointToVec3(matrix.transformPoint(vec3ToDomPoint(vertex))));
			}

			//If the normal of the face is pointing in positive z, then the object is facing the user
			// otherwise, we cull it
			const last_vec = face_veterices.at(-1);
			if (last_vec == null) {
				throw new Error("How the fuck did you make a face without a single vertex");
			}

			const normal = cross_product(
				subVec3(face_veterices[2], face_veterices[1]),
				subVec3(face_veterices[0], face_veterices[1]),
			);

			if (normal.z > 0) {
				face_index += 1;
				continue;
			}

			this.applyTexture(c, face_veterices, face_index);
			face_index += 1;

			// console.log(face, normal)

			for (const drawn_vertex of face_veterices) {
				if (frist) {
					frist = false;
					c.moveTo(drawn_vertex.x, drawn_vertex.y);
				} else {
					c.lineTo(drawn_vertex.x, drawn_vertex.y);
				}
			}
			c.closePath();
			c.stroke();

			frist = true;
		}
		c.restore();
	}
}

export const Cube = new Polyhedron3D(
	//verticies
	[
		vec3(0, 0, 0), // 0
		vec3(1, 0, 0), // 1
		vec3(1, 1, 0), // 2
		vec3(0, 1, 0), // 3
		vec3(0, 0, 1), // 4
		vec3(1, 0, 1), // 5
		vec3(1, 1, 1), // 6
		vec3(0, 1, 1), // 7
	],
	//faces
	[
		[0, 1, 2, 3], //face 1
		// [3, 0, 2],

		[0, 3, 7, 4], //face 2
		// [0, 7, 3],

		[0, 4, 5, 1], //face 3
		// [4, 1, 0],

		[7, 6, 5, 4], //face 4
		// [5, 7, 6],

		[1, 5, 6, 2], //face 5
		// [2, 1, 6],

		[3, 2, 6, 7], //face 5
		// [7, 2, 6],
	],
);

/***
 * The right hand rule points into the shape
 * for what is considered clockwise
 */

export const Pyramid = new Polyhedron3D(
	//verticies
	[
		vec3(0, 0, 0), // 0
		vec3(1, 0, 0), // 1
		vec3(0, 1, 0), // 2
		vec3(1, 1, 0), // 3
		vec3(0.5, 0.5, 1), // 4
	],
	//faces
	[
		[0, 2, 3, 1],
		[0, 1, 4],
		[0, 4, 2],
		[1, 3, 4],
		[3, 2, 4],
	],
);

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export const D20 = (autoRotate?: boolean) =>
	new Polyhedron3D(
		//verticies
		[
			vec3(0, 1, GOLDEN_RATIO), // 0
			vec3(0, -1, GOLDEN_RATIO), // 1
			vec3(0, 1, -GOLDEN_RATIO), // 2
			vec3(0, -1, -GOLDEN_RATIO), // 3
			vec3(1, GOLDEN_RATIO, 0), // 4
			vec3(-1, GOLDEN_RATIO, 0), // 5
			vec3(1, -GOLDEN_RATIO, 0), // 6
			vec3(-1, -GOLDEN_RATIO, 0), // 7
			vec3(GOLDEN_RATIO, 0, 1), // 8
			vec3(-GOLDEN_RATIO, 0, 1), // 9
			vec3(GOLDEN_RATIO, 0, -1), // 10
			vec3(-GOLDEN_RATIO, 0, -1), // 11
		],
		//faces
		[
			[0, 5, 4], //1
			[0, 9, 5], //2
			[0, 4, 8], //3
			[0, 8, 1], //4
			[0, 1, 9], //5
			[2, 4, 5], //6
			[2, 5, 11], //7
			[2, 11, 3], //8
			[2, 3, 10], //9
			[2, 10, 4], //10
			[3, 7, 6], //11
			[3, 6, 10], //12
			[3, 11, 7], //13
			[7, 9, 1], //14
			[7, 1, 6], //15
			[1, 8, 6], //16
			[4, 10, 8], //17
			[5, 9, 11], //18
			[11, 9, 7], //19
			[6, 8, 10], //20
		],
		autoRotate,
	);
