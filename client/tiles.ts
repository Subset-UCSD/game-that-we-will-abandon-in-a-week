import {
	addVec,
	CHUNK_SIZE,
	type ChunkMap,
	ev,
	isVecEq,
	scaleVec,
	TILE_SIZE,
	type TileId,
	type Vec2,
	vec2,
	vecMap1,
	vecToArray,
} from "@common";
import { mat4, vec3 } from "gl-matrix";
import type { Camera } from "./camera";
import type { Canvas } from "./render";

type TileRegistryEntry = { tile: TileId; color: string } | { bl: TileId; mid: TileId; path: string };

// Register your tile textures here (top has priority)
const tileRegistry: TileRegistryEntry[] = [
	// this must be at the top so void is rendered as black
	{ tile: "black", color: "black" },
	{ tile: "temp_dirt", color: "#473327" },
	{ tile: "temp_water", color: "#23457a" },
	{ bl: "grass", mid: "dirt", path: "assets/tilesets/grass-path/janky-grass-path.png" },
	{ bl: "black", mid: "bad_wall", path: "assets/tilesets/wall-black.png" },
	{ bl: "grass", mid: "bad_wall", path: "assets/tilesets/crappy-wall.png" },
];

const pairTilePositions = {
	"':": vec2(0, 0),
	".'": vec2(0, 1),
	":.": vec2(0, 2),
	"::": vec2(0, 3),
	": ": vec2(1, 0),
	"' ": vec2(1, 1),
	"..": vec2(1, 2),
	":'": vec2(1, 3),
	" '": vec2(2, 0),
	"  ": vec2(2, 1),
	". ": vec2(2, 2),
	"'.": vec2(2, 3),
	"''": vec2(3, 0),
	" .": vec2(3, 1),
	" :": vec2(3, 2),
	".:": vec2(3, 3),
};

/** width in texels */
const tileSize = 32;

type IndividualTile =
	| { type: "color"; color: string }
	| { type: "tilemap"; side: "bl" | "mid"; image: ImageBitmap; tileSize: number };
const individualTileTextures = new Map<TileId, IndividualTile>();
const pairTileTextures = new Map<TileId, Map<TileId, { image: ImageBitmap; tileSize: number }>>();
const promises: Promise<void>[] = [];
const workCanvas = document.createElement("canvas");
const wc = workCanvas.getContext("2d");
if (!wc) throw new Error("holy dshgitt");
const textures: { key: string; image: Uint8ClampedArray }[] = [];
for (const entry of tileRegistry) {
	promises.push(
		(async () => {
			if ("color" in entry) {
				individualTileTextures.set(entry.tile, { type: "color", color: entry.color });
				workCanvas.width = tileSize;
				workCanvas.height = tileSize;
				wc.fillStyle = entry.color;
				wc.fillRect(0, 0, tileSize, tileSize);
				textures.push({ key: entry.tile, image: wc.getImageData(0, 0, tileSize, tileSize).data });
				return;
			}
			const image = await fetch(entry.path)
				.then((r) => r.blob())
				.then(createImageBitmap);
			workCanvas.width = tileSize * 4;
			workCanvas.height = tileSize * 4;
			wc.drawImage(image, 0, 0);
			individualTileTextures.getOrInsertComputed(entry.bl, () => {
				textures.push({ key: entry.bl, image: wc.getImageData(0, 3 * tileSize, tileSize, tileSize).data });
				return { type: "tilemap", side: "bl", image, tileSize };
			});
			individualTileTextures.getOrInsertComputed(entry.mid, () => {
				textures.push({ key: entry.mid, image: wc.getImageData(2 * tileSize, tileSize, tileSize, tileSize).data });
				return { type: "tilemap", side: "mid", image, tileSize };
			});
			pairTileTextures
				.getOrInsertComputed(entry.bl, () => new Map())
				.getOrInsertComputed(entry.mid, () => {
					for (const [key, vec] of Object.entries(pairTilePositions)) {
						if (key === "::" || key === "  ") continue;
						textures.push({
							key: `${entry.bl} ${entry.mid} ${key}`,
							image: wc.getImageData(vec.x * tileSize, vec.y * tileSize, tileSize, tileSize).data,
						});
					}
					return { image, tileSize };
				});
			// workCanvas.width = tileSize*4
			// workCanvas.height = tileSize*4
			// wc.drawImage(image,0, 0, )
		})(),
	);
}
await Promise.all(promises);

const tileNumbers = new Map<TileId, number>([
	["dirt", 1],
	["grass", 2],
	["bad_wall", 3],
]);

export class GlTileRenderer {
	#texture?: { size: Vec2; texture: WebGLTexture };
	#lastDataKey?: { tileRef: ChunkMap; dataOrigin: Vec2 };
	#canvas: Canvas;
	#keyToTextureNum = new Map<string, number>();
	#tileTextures: WebGLTexture;

	constructor(canvas: Canvas) {
		this.#canvas = canvas;

		// https://archive.ph/74hHL
		const gl = this.#canvas.gl.gl;
		this.#tileTextures = gl.createTexture();
		this.#canvas.gl.bindTexture(1, "2d-array", this.#tileTextures);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// gl.texStorage3D( gl.TEXTURE_2D_ARRAY , 1 , gl.RGBA8 , tileSize , tileSize , textures.length );
		// gl.pixelStorei( gl.UNPACK_ROW_LENGTH , tileSize );

		const fullData = new Uint8Array(tileSize * tileSize * textures.length * 4);
		for (const [i, { key, image }] of textures.entries()) {
			fullData.set(image, tileSize * tileSize * i * 4);
			this.#keyToTextureNum.set(key, i);
			if (i > 255) throw new Error("we dont support this many textures u will need to refactor sorry");
		}
		gl.texImage3D(
			gl.TEXTURE_2D_ARRAY, // target
			0, // level (mip map)
			gl.RGBA8, // internalformat
			tileSize, // width
			tileSize, // height
			textures.length, // depth (number of layers)
			0, // border muist be 0
			gl.RGBA, // format
			gl.UNSIGNED_BYTE, // type
			fullData, // srcData
		);
		this.#canvas.gl.bindTexture(1, "2d-array", null);
	}

	/**
	 * will also bind the texture
	 */
	#updateTileDataTextureIfNeeded(camera: Camera, tiles: ChunkMap): { chunkStart: Vec2; dataSize: Vec2 } {
		const canvas = this.#canvas;
		const gl = canvas.gl.gl;
		const screenSize = vec2(canvas.width, canvas.height);

		// add a tile size to each dimension since we read 2x2 (i am not sure if my logic is sound but whatever)
		const minChunkSize = vecMap1(screenSize, (dim) => Math.ceil((dim + TILE_SIZE) / (CHUNK_SIZE * TILE_SIZE)) + 1);
		let isNew = false;
		if (!this.#texture || !isVecEq(this.#texture.size, minChunkSize)) {
			console.log("detected min chunk count change, regenerating tile data texture");
			// Only resize the texture when needed (this should only happen when the canvas resizes)
			if (this.#texture) {
				gl.deleteTexture(this.#texture.texture);
			}
			this.#texture = {
				size: minChunkSize,
				texture: gl.createTexture(),
			};
			canvas.gl.bindTexture(0, "2d", this.#texture.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			// https://stackoverflow.com/a/47362259
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
			// allow default wrap of repeat
			isNew = true;
			this.#lastDataKey = undefined;
		} else {
			canvas.gl.bindTexture(0, "2d", this.#texture.texture);
		}

		const screenStart = ev`${camera} - ${screenSize} / 2 / ${camera.z}`;
		const screenEnd = ev`${camera} + ${screenSize} / 2 / ${camera.z}`;
		const chunkStart = vecMap1(screenStart, (coord) => Math.floor((coord - TILE_SIZE / 2) / (TILE_SIZE * CHUNK_SIZE)));
		const tileStart = vecMap1(screenStart, (coord) => Math.floor((coord - TILE_SIZE / 2) / TILE_SIZE));
		const tileEnd = vecMap1(screenEnd, (coord) => Math.ceil((coord - TILE_SIZE / 2) / TILE_SIZE));
		const dataSize = scaleVec(minChunkSize, CHUNK_SIZE);

		if (this.#lastDataKey?.tileRef === tiles && isVecEq(this.#lastDataKey.dataOrigin, chunkStart)) {
			// we done here, tile data hasnt changed
			return { chunkStart, dataSize };
		}

		const data = new Uint8Array(
			// round up to multiple of 4 bytes so this can be reinterpreted as uint32 for faster diff
			Math.ceil((dataSize.x * dataSize.y) / 4) * 4,
		);
		for (let cx = 0; cx < minChunkSize.x; cx++)
			for (let cy = 0; cy < minChunkSize.y; cy++) {
				const chunk = tiles[`${chunkStart.x + cx} ${chunkStart.y + cy}`];
				if (!chunk) continue;
				const right = tiles[`${chunkStart.x + cx + 1} ${chunkStart.y + cy}`];
				const below = tiles[`${chunkStart.x + cx} ${chunkStart.y + cy + 1}`];
				const belowRight = tiles[`${chunkStart.x + cx + 1} ${chunkStart.y + cy + 1}`];
				// is it more efficient to just iterate through all the tiles in the chunks or try limiting the umbero f iterations
				for (const [i, cornerTL] of chunk.entries()) {
					const local = vec2(i % CHUNK_SIZE, Math.floor(i / CHUNK_SIZE));
					const cornerTR = local.x < CHUNK_SIZE - 1 ? chunk[i + 1] : (right?.[local.y * CHUNK_SIZE] ?? null);
					const cornerBL = local.y < CHUNK_SIZE - 1 ? chunk[i + CHUNK_SIZE] : (below?.[local.x] ?? null);
					const cornerBR =
						local.y < CHUNK_SIZE - 1
							? local.x < CHUNK_SIZE - 1
								? chunk[i + CHUNK_SIZE + 1]
								: (right?.[(local.y + 1) * CHUNK_SIZE] ?? null)
							: local.x < CHUNK_SIZE - 1
								? (below?.[local.x + 1] ?? null)
								: (belowRight?.[0] ?? null);
					const set = new Set([cornerTL, cornerTR, cornerBL, cornerBR].values().filter((x) => x !== null));
					const dataOffset = ev`${vec2(cx, cy)} * ${CHUNK_SIZE} + ${local}`;
					const index = dataOffset.y * dataSize.x + dataOffset.x;
					if (set.size === 1) {
						const [tile] = set;
						data[index] = this.#keyToTextureNum.get(tile) ?? 0;
					} else if (set.size === 2)
						wow: {
							const [tileA, tileB] = set;
							let entry = pairTileTextures.get(tileA)?.get(tileB);
							let pair;
							if (entry) {
								pair = { entry, bl: tileA, mid: tileB };
							} else {
								entry = pairTileTextures.get(tileB)?.get(tileA);
								if (entry) {
									pair = { entry, bl: tileB, mid: tileA };
								} else {
									break wow;
								}
							}
							const { bl, mid } = pair;

							const key = `${pair.bl} ${pair.mid} ${`${cornerBL === bl ? (cornerTL === bl ? ":" : ".") : cornerTL === bl ? "'" : " "}${
								cornerBR === bl ? (cornerTR === bl ? ":" : ".") : cornerTR === bl ? "'" : " "
							}`}`;
							// if (!this.#keyToTextureNum.has(key)) throw key
							data[index] = this.#keyToTextureNum.get(key) ?? 0;
						}
					// const num = tile && tileNumbers.get(tile)
					// if (set.size > 0) {
					// }
				}
			}

		// const reinterpret = new Uint32Array(data.buffer)
		if (isNew) {
			gl.texImage2D(
				gl.TEXTURE_2D, // target
				0, // level (mipmap level)
				gl.R8, // internalformat
				dataSize.x, // width
				dataSize.y, // height
				0, // border (must be 0)
				gl.RED, // format
				gl.UNSIGNED_BYTE, // type
				data, // srcData
				// 0	// srcOffset
			);
			console.log("sent to GPU", data.byteLength, "bytes (+ allocation)");
		} else {
			// (we can assume lastData is already set)
			// only send tile data if tiles have changed
			// if (this.#lastData?.some((n, i) => n !== reinterpret[i])) {
			console.log("detected tile change, reuploading tile data");
			gl.texSubImage2D(
				gl.TEXTURE_2D, //target
				0, //level
				// it may be faster to only send the parts visible on screen
				0, //xoffset
				0, //yoffset
				dataSize.x, //width
				dataSize.y, //height
				gl.RED, //format
				gl.UNSIGNED_BYTE, //type
				data, //srcData
				// srcOffset
			);
			console.log("sent to GPU", data.byteLength, "bytes");
			// }
		}
		this.#lastDataKey = { tileRef: tiles, dataOrigin: chunkStart };

		return { chunkStart, dataSize };
	}

	/**
	 * shake is a separate parameter so that it doesn't rapidly unload/reload
	 * chunks if the player is unlucky
	 *
	 * refs:
	 * - [updating textures][texture-update]
	 *
	 * [texture-update]:
	 * https://dannywoodz.wordpress.com/2015/10/14/webgl-from-scratch-updating-textures/
	 */
	renderTilesGl(camera: Camera, shake: Vec2, tiles: ChunkMap): void {
		const canvas = this.#canvas;
		const gl = canvas.gl.gl;

		// this binds tile data texture (this.#texture) at location 0 btw
		const { chunkStart, dataSize } = this.#updateTileDataTextureIfNeeded(camera, tiles);

		// now that we have uploaded the texture data we can render

		// This is different than the cameraTransformation we constructed outside
		// To keep floats small, we should go for a coordinate system of [-1, 1] -> [0, dataSize] i think
		// or maybe the shader can figure that out?
		// tbh this is probably the shader's problem. but we still need to apply camera transformation
		const cameraTransformation = camera.getTransformationMatrix()

		// At this point cameraTransformation is the same as constructed outside
		// now i think we need two things:
		// 1. make 1 tile = 1 px (so scale out by TILE_SIZE)
		// 2. adjust translation so that (0, 0) is the origin of our `data` rather than the world (so translate by chunkStart)
		// hmm
		// i guess ultimately, it is calling u_view_inv * v_position
		// so,
		// - outside cameraTransformation turns world coord -> [-1, 1]
		// - so outside cameraTransformationInverse would turn [-1, 1] -> world coord
		// - but we want cameraTransformationInverse to turn [-1, 1] -> (x, y) into texture
		//   which maybe we can do by messing with cameraTransformationInverse

		// first, subtract chunkStart so that chunkStart becomes the origin
		mat4.translate(
			cameraTransformation,
			cameraTransformation,
			vec3.fromValues(
				chunkStart.x * CHUNK_SIZE * TILE_SIZE + TILE_SIZE / 2,
				chunkStart.y * CHUNK_SIZE * TILE_SIZE + TILE_SIZE / 2,
				0,
			),
		);
		// then, shrink the coordinate space so that [0, TILE_SIZE] -> [0, dataSize]
		mat4.scale(cameraTransformation, cameraTransformation, vec3.fromValues(TILE_SIZE, TILE_SIZE, 1));
		// and i think we did it

		const cameraTransformationInverse = mat4.create();
		mat4.invert(cameraTransformationInverse, cameraTransformation);
		// currently this matrix turns [-1, 1] -> world coord
		// now we need to make world coord -> tile (x, y)
		// isnt this what we did above

		canvas.gl.tileShader.use();

		gl.uniformMatrix4fv(canvas.gl.tileShader.uniform("u_view_inv"), false, cameraTransformationInverse);
		gl.uniform2f(canvas.gl.tileShader.uniform("data_size"), dataSize.x, dataSize.y);

		// canvas.gl.bindTexture(0, "2d", texture);
		// 0 here is the 0 we passed into bindTexture above
		gl.uniform1i(canvas.gl.tileShader.uniform("u_tilemap"), 0);
		gl.uniform1i(canvas.gl.tileShader.uniform("u_tile_textures"), 1);
		canvas.gl.bindTexture(1, "2d-array", this.#tileTextures);

		gl.drawArraysInstanced(
			gl.TRIANGLES,
			0, //Start index
			6, //number of vertices
			1, // number of instances
		);

		canvas.gl.bindTexture(0, "2d", null);
		canvas.gl.bindTexture(1, "2d-array", null);
	}
}

const offsets = [vec2(1), vec2(0, 1), vec2(0, 0), vec2(1, 0)];

// according to chrome performance tab, the cum performance impact of this function (because it's called so often)
// is almost as bad as drawImage
function getTile(tiles: ChunkMap, coord: Vec2): TileId | null {
	const chunkCoord = vecMap1(coord, (c) => Math.floor(c / CHUNK_SIZE));
	const localCoord = vecMap1(coord, (c) => ((c % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE);
	return tiles[`${chunkCoord.x} ${chunkCoord.y}`]?.[localCoord.y * CHUNK_SIZE + localCoord.x] ?? null;
}

// this is kinda inefficient but whatever
// if we wanted speed we'd use webgl
export function renderTiles(canvas: Canvas, camera: Camera, tiles: ChunkMap, enableDebug = false): void {
	// TEMP: for debugging
	// renderTilesOld(canvas, camera, tiles)

	const { width, height, c } = canvas;
	c.imageSmoothingEnabled = false;

	const left = camera.x - width / camera.z / 2;
	const right = camera.x + width / camera.z / 2;
	const startX = Math.floor((left - TILE_SIZE / 2) / TILE_SIZE);
	const endX = Math.ceil((right - TILE_SIZE / 2) / TILE_SIZE);

	const top = camera.y - height / camera.z / 2;
	const bottom = camera.y + height / camera.z / 2;
	const startY = Math.floor((top - TILE_SIZE / 2) / TILE_SIZE);
	const endY = Math.ceil((bottom - TILE_SIZE / 2) / TILE_SIZE);

	const screenSize = { x: width, y: height };
	const screenStart = ev`${camera} - ${screenSize} / ${camera.z} / 2`;
	const screenEnd = ev`${camera} + ${screenSize} / ${camera.z} / 2`;
	const tileStart = vecMap1(screenStart, (coord) => Math.floor((coord - TILE_SIZE / 2) / TILE_SIZE));
	const tileEnd = vecMap1(screenEnd, (coord) => Math.ceil((coord - TILE_SIZE / 2) / TILE_SIZE));

	// HELP!! 🚨🚨 can someone format this file pleasee

	if (enableDebug) {
		c.strokeStyle = "blue";
		for (let y = tileStart.y; y < tileEnd.y; y++)
			for (let x = tileStart.x; x < tileEnd.x; x++) {
				const tileCoord = { x, y };
				const tileBase = ev`${tileCoord} * ${TILE_SIZE} + ${vec2(TILE_SIZE / 2)}`;
				// c.fillRect(
				//   (x + 0.2) * TILE_SIZE+TILE_SIZE/2,
				//   (y + 0.2) * TILE_SIZE+TILE_SIZE/2,
				//   TILE_SIZE*0.6,
				//   TILE_SIZE*0.6,
				// )
				// c.strokeRect(
				//   (x ) * TILE_SIZE+TILE_SIZE/2,
				//   (y ) * TILE_SIZE+TILE_SIZE/2,
				//   TILE_SIZE,
				//   TILE_SIZE,
				// )

				const [tileBR, tileBL, tileTL, tileTR] = offsets.map((o) => getTile(tiles, addVec(tileCoord, o)));
				const allTiles = new Set([tileBR, tileBL, tileTL, tileTR].filter((x) => x !== null));
				const hasVoid = tileBR === null || tileBL === null || tileTL === null || tileTR === null;
				if (allTiles.size === 0) {
					continue;
				} else if (allTiles.size === 1) {
					const [tile] = allTiles;
					const indiv = individualTileTextures.get(tile);
					if (indiv) {
						// if (indiv.type === "color") {
						// 	c.fillStyle = indiv.color;
						// 	c.fillRect(...vecToArray(tileBase), ...vecToArray(vec2(TILE_SIZE)));
						// } else if (indiv.type === "tilemap") {
						// 	c.drawImage(
						// 		indiv.image,
						// 		...vecToArray(
						// 			vecMap2(vec2(indiv.tileSize), pairTilePositions[indiv.side === "bl" ? "::" : "  "], (a, b) => a * b),
						// 		),
						// 		...vecToArray(vec2(indiv.tileSize)),
						// 		...vecToArray(tileBase),
						// 		...vecToArray(vec2(TILE_SIZE)),
						// 	);
						// }
					}
				} else {
					let drew = false;
					tilePair: if (allTiles.size === 2) {
						const [a, b] = allTiles;
						let pairImage, bl;
						pairImage = pairTileTextures.get(a)?.get(b);
						if (pairImage) {
							bl = a;
						} else {
							pairImage = pairTileTextures.get(b)?.get(a);
							if (pairImage) {
								bl = b;
							} else {
								break tilePair;
							}
						}
						// c.drawImage(
						// 	pairImage.image,
						// 	...vecToArray(
						// 		vecMap2(
						// 			vec2(pairImage.tileSize),
						// 			pairTilePositions[
						// 				`${tileBL === bl ? (tileTL === bl ? ":" : ".") : tileTL === bl ? "'" : " "}${
						// 					tileBR === bl ? (tileTR === bl ? ":" : ".") : tileTR === bl ? "'" : " "
						// 				}`
						// 			],
						// 			(a, b) => a * b,
						// 		),
						// 	),
						// 	...vecToArray(vec2(pairImage.tileSize)),
						// 	...vecToArray(tileBase),
						// 	...vecToArray(vec2(TILE_SIZE)),
						// );
						drew = true;
					}

					if (!drew) {
						let hasTile = false;
						for (const [i, tile] of [tileBR, tileBL, tileTL, tileTR].entries()) {
							if (tile === null) continue;
							const offset = offsets[i];
							const indiv = individualTileTextures.get(tile);
							if (!indiv) continue;
							if (indiv.type === "color") {
								c.fillStyle = indiv.color;
								// c.fillRect(
								// 	...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2}`),
								// 	...vecToArray(vec2(TILE_SIZE / 2)),
								// );
							} else if (indiv.type === "tilemap") {
								hasTile = true;
								// c.drawImage(
								// 	indiv.image,
								// 	...vecToArray(
								// 		ev`${vecMap2(
								// 			vec2(indiv.tileSize),
								// 			pairTilePositions[indiv.side === "bl" ? "::" : "  "],
								// 			(a, b) => a * b,
								// 		)} + ${offset} * ${indiv.tileSize / 2}`,
								// 	),
								// 	...vecToArray(vec2(indiv.tileSize / 2)),
								// 	...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2}`),
								// 	...vecToArray(vec2(TILE_SIZE / 2)),
								// );
							}
						}
						if (hasTile && enableDebug) {
							c.strokeStyle = "blue";
							c.beginPath();
							c.moveTo(...vecToArray(ev`${tileBase} + ${vec2(TILE_SIZE, 0)}`));
							c.lineTo(...vecToArray(ev`${tileBase} + ${vec2(0, TILE_SIZE)}`));
							c.moveTo(...vecToArray(ev`${tileBase} + ${vec2(TILE_SIZE / 2, 0)}`));
							c.lineTo(...vecToArray(ev`${tileBase} + ${vec2(0, TILE_SIZE / 2)}`));
							c.moveTo(...vecToArray(ev`${tileBase} + ${vec2(TILE_SIZE / 2, TILE_SIZE)}`));
							c.lineTo(...vecToArray(ev`${tileBase} + ${vec2(TILE_SIZE, TILE_SIZE / 2)}`));
							c.stroke();
						}
					}
				}

				if (hasVoid && enableDebug) {
					c.strokeStyle = "red";
					c.beginPath();
					for (const [i, thing] of [tileBR, tileBL, tileTL, tileTR].entries()) {
						if (thing !== null) continue;
						const offset = offsets[i];
						c.moveTo(...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2}`));
						c.lineTo(...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2} + ${vec2(TILE_SIZE / 2)}`));
					}
					c.stroke();
				}
			}
	}
	// TEMP
	// c.strokeStyle = 'red'
	// c.strokeRect(left+TILE_SIZE, top+TILE_SIZE, right - left - 2*TILE_SIZE, bottom-top - 2*TILE_SIZE)

	c.imageSmoothingEnabled = true;
}

export function renderTilesOld(canvas: Canvas, camera: Camera, tiles: ChunkMap): void {
	const { width, height } = canvas;
	const left = camera.x - width / camera.z / 2;
	const right = camera.x + width / camera.z / 2;
	const top = camera.y - height / camera.z / 2;
	const bottom = camera.y + height / camera.z / 2;

	for (const [key, chunk] of Object.entries(tiles)) {
		const [chunkX, chunkY] = key.split(" ").map(Number);
		if (
			chunkX * TILE_SIZE * CHUNK_SIZE <= right &&
			left <= (chunkX + 1) * TILE_SIZE * CHUNK_SIZE &&
			chunkY * TILE_SIZE * CHUNK_SIZE <= bottom &&
			top <= (chunkY + 1) * TILE_SIZE * CHUNK_SIZE
		) {
			renderChunk(canvas, { x: chunkX * TILE_SIZE * CHUNK_SIZE, y: chunkY * TILE_SIZE * CHUNK_SIZE }, chunk);
		}
	}
}

function renderChunk({ c }: Canvas, base: Vec2, tiles: (TileId | null)[]) {
	for (let y = 0; y < CHUNK_SIZE; y++) {
		for (let x = 0; x < CHUNK_SIZE; x++) {
			const i = y * CHUNK_SIZE + x;
			const tile = tiles[i];
			if (tile === null) continue;
			c.fillStyle = "brown";
			c.fillRect(base.x + x * TILE_SIZE, base.y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}
}
