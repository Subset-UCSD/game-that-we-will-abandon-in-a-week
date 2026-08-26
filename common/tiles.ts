import z from "zod"

export const CHUNK_SIZE = 20


/**
 * number of pixels per tile (we should adjust this once then never again)
 */
export const TILE_SIZE = 40

export const tileSchema = z.literal([
  'dirt',
  'grass',
  'bad_wall',
  'black',

  // legacy
  'temp_dirt',
  'temp_water',
])

export type TileId = z.infer<typeof tileSchema>

const chunkSchema = (z.array(tileSchema.nullable()))
export type Chunk = z.infer<typeof chunkSchema>

export const chunkMapSchema = z.record(z.templateLiteral([z.number(),' ', z.number()]), chunkSchema)
export type ChunkMap = z.infer<typeof chunkMapSchema> 
