import { addVec, CHUNK_SIZE, ChunkMap, scaleVec, TILE_SIZE, TileId, Vec2 } from "@common";
import { Canvas } from "./render";
import { Camera } from "./game";

export function renderTiles (canvas: Canvas, camera: Camera, tiles: ChunkMap): void {
  const {width,height} = canvas
  const left = camera.x - width/camera.scale/2
      const right = camera.x + width/camera.scale/2
        const top = camera.y - height/camera.scale/2
      const bottom = camera.y + height/camera.scale/2

  for (const [key, chunk] of Object.entries(tiles)) {
    const [chunkX, chunkY] = key.split(' ').map(Number)
    if (
      chunkX * TILE_SIZE * CHUNK_SIZE <= right &&
      left <= (chunkX + 1) * TILE_SIZE * CHUNK_SIZE &&
      chunkY * TILE_SIZE * CHUNK_SIZE <= bottom &&
      top <= (chunkY + 1) * TILE_SIZE * CHUNK_SIZE 
    ) {
      renderChunk(canvas,{x: chunkX * TILE_SIZE * CHUNK_SIZE, y: chunkY * TILE_SIZE * CHUNK_SIZE}, chunk)
    }
  }
}

function renderChunk ({c}:Canvas,base: Vec2, tiles: (TileId | null)[]) {
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const i = y * CHUNK_SIZE + x
      const tile = tiles[i]
      if (tile === null) continue
      c.fillStyle = 'brown'
      c.fillRect(base.x + x * TILE_SIZE, base.y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
  }
  }
}