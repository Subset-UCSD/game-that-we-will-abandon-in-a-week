import {
	addVec,
	CHUNK_SIZE,
	type ChunkMap,
	ev,
	TILE_SIZE,
	type TileId,
	type Vec2,
	vec2,
	vecMap1,
	vecMap2,
	vecToArray,
} from "@common";
import type { Camera } from "./game";
import type { Canvas } from "./render";

type TileRegistryEntry = { tile: TileId; color: string } | { bl: TileId; mid: TileId; path: string };

// Register your tile textures here
const tileRegistry: TileRegistryEntry[] = [
	{ tile: "temp_dirt", color: "#473327" },
	{ tile: "temp_water", color: "#23457a" },
	{ bl: "grass", mid: "dirt", path: "assets/tilesets/grass-path/janky-grass-path.png" },
	{ bl: "black", mid: "bad_wall", path: "assets/tilesets/wall-black.png" },
	{ bl: "grass", mid: "bad_wall", path: "assets/tilesets/crappy-wall.png" },
	{ tile: "black", color: "black" },
];

type IndividualTile =
	| { type: "color"; color: string }
	| { type: "tilemap"; side: "bl" | "mid"; image: ImageBitmap; tileSize: number };
const individualTileTextures = new Map<TileId, IndividualTile>();
const pairTileTextures = new Map<TileId, Map<TileId, { image: ImageBitmap; tileSize: number }>>();
const promises: Promise<void>[] = [];
for (const entry of tileRegistry) {
	promises.push(
		(async () => {
			if ("color" in entry) {
				individualTileTextures.set(entry.tile, { type: "color", color: entry.color });
				return;
			}
			const image = await fetch(entry.path)
				.then((r) => r.blob())
				.then(createImageBitmap);
			const tileSize = 32;
			individualTileTextures.getOrInsert(entry.bl, { type: "tilemap", side: "bl", image, tileSize });
			individualTileTextures.getOrInsert(entry.mid, { type: "tilemap", side: "mid", image, tileSize });
			pairTileTextures.getOrInsertComputed(entry.bl, () => new Map()).set(entry.mid, { image, tileSize });
		})(),
	);
}
await Promise.all(promises);

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

const offsets = [vec2(1), vec2(0, 1), vec2(0, 0), vec2(1, 0)];

// according to chrome performance tab, the cum performance impact of this function (because it's called so often)
// is almost as bad as drawImage
function getTile(tiles: ChunkMap, coord: Vec2): TileId | null {
	const chunkCoord = vecMap1(coord, (c) => Math.floor(c / CHUNK_SIZE));
	const localCoord = vecMap1(coord, (c) => ((c % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE);
	return tiles[`${chunkCoord.x} ${chunkCoord.y}`]?.[localCoord.y * CHUNK_SIZE + localCoord.x] ?? null;
}

export function renderTilesGl (canvas: Canvas, camera: Camera, tiles: ChunkMap): void {
	const screenSize = vec2(canvas.width, canvas.height)
	const minChunkSize = vecMap1(screenSize, dim => Math.ceil(dim / (CHUNK_SIZE * TILE_SIZE)) + 1)
	const screenStart = ev`${camera} - ${screenSize} / 2 / ${camera.scale}`
	const screenEnd = ev`${camera} + ${screenSize} / 2 / ${camera.scale}`
}

// this is kinda inefficient but whatever
// if we wanted speed we'd use webgl
export function renderTiles(canvas: Canvas, camera: Camera, tiles: ChunkMap, enableDebug = false): void {
	// TEMP: for debugging
	// renderTilesOld(canvas, camera, tiles)

	const { width, height, c } = canvas;
	c.imageSmoothingEnabled = false;

	const left = camera.x - width / camera.scale / 2;
	const right = camera.x + width / camera.scale / 2;
	const startX = Math.floor((left - TILE_SIZE / 2) / TILE_SIZE);
	const endX = Math.ceil((right - TILE_SIZE / 2) / TILE_SIZE);

	const top = camera.y - height / camera.scale / 2;
	const bottom = camera.y + height / camera.scale / 2;
	const startY = Math.floor((top - TILE_SIZE / 2) / TILE_SIZE);
	const endY = Math.ceil((bottom - TILE_SIZE / 2) / TILE_SIZE);

	const screenSize = { x: width, y: height };
	const screenStart = ev`${camera} - ${screenSize} / ${camera.scale} / 2`;
	const screenEnd = ev`${camera} + ${screenSize} / ${camera.scale} / 2`;
	const tileStart = vecMap1(screenStart, (coord) => Math.floor((coord - TILE_SIZE / 2) / TILE_SIZE));
	const tileEnd = vecMap1(screenEnd, (coord) => Math.ceil((coord - TILE_SIZE / 2) / TILE_SIZE));

	// HELP!! 🚨🚨 can someone format this file pleasee

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
					if (indiv.type === "color") {
						c.fillStyle = indiv.color;
						c.fillRect(...vecToArray(tileBase), ...vecToArray(vec2(TILE_SIZE)));
					} else if (indiv.type === "tilemap") {
						c.drawImage(
							indiv.image,
							...vecToArray(
								vecMap2(vec2(indiv.tileSize), pairTilePositions[indiv.side === "bl" ? "::" : "  "], (a, b) => a * b),
							),
							...vecToArray(vec2(indiv.tileSize)),
							...vecToArray(tileBase),
							...vecToArray(vec2(TILE_SIZE)),
						);
					}
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
					c.drawImage(
						pairImage.image,
						...vecToArray(
							vecMap2(
								vec2(pairImage.tileSize),
								pairTilePositions[
									`${tileBL === bl ? (tileTL === bl ? ":" : ".") : tileTL === bl ? "'" : " "}${
										tileBR === bl ? (tileTR === bl ? ":" : ".") : tileTR === bl ? "'" : " "
									}`
								],
								(a, b) => a * b,
							),
						),
						...vecToArray(vec2(pairImage.tileSize)),
						...vecToArray(tileBase),
						...vecToArray(vec2(TILE_SIZE)),
					);
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
							c.fillRect(
								...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2}`),
								...vecToArray(vec2(TILE_SIZE / 2)),
							);
						} else if (indiv.type === "tilemap") {
							hasTile = true;
							c.drawImage(
								indiv.image,
								...vecToArray(
									ev`${vecMap2(
										vec2(indiv.tileSize),
										pairTilePositions[indiv.side === "bl" ? "::" : "  "],
										(a, b) => a * b,
									)} + ${offset} * ${indiv.tileSize / 2}`,
								),
								...vecToArray(vec2(indiv.tileSize / 2)),
								...vecToArray(ev`${tileBase} + ${offset} * ${TILE_SIZE / 2}`),
								...vecToArray(vec2(TILE_SIZE / 2)),
							);
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
	// TEMP
	// c.strokeStyle = 'red'
	// c.strokeRect(left+TILE_SIZE, top+TILE_SIZE, right - left - 2*TILE_SIZE, bottom-top - 2*TILE_SIZE)

	c.imageSmoothingEnabled = true;
}

export function renderTilesOld(canvas: Canvas, camera: Camera, tiles: ChunkMap): void {
	const { width, height } = canvas;
	const left = camera.x - width / camera.scale / 2;
	const right = camera.x + width / camera.scale / 2;
	const top = camera.y - height / camera.scale / 2;
	const bottom = camera.y + height / camera.scale / 2;

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
