import { TileId } from "@common";

export const CHUNK_SIZE = 20

export type Chunk = (TileId | null)[][]
export type ChunkMap = Record<`${number} ${number}`, Chunk>


