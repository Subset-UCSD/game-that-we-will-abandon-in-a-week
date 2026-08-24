import { Chunk, CHUNK_SIZE, TileId, tileSchema, Vec2 } from "@common";


export type ChunkEntry = {
  tileChars: Map<TileId, string>
  tiles: Chunk
}
export type ChunkEntryMap = Map<`${number} ${number}`, ChunkEntry>

export function serializeTiles (map: ChunkEntryMap): string {
  if (map.size === 0) {
    return ''
  }
  return map.entries()
    .map(([key, { tileChars, tiles }]) => {
      if (tiles.length !== CHUNK_SIZE * CHUNK_SIZE) {
        throw new RangeError(`invalid tiles for ${key} has length ${tiles.length}`)
      }
      return `${key}\n${
      tileChars.entries().map(([tile, char]) => `${char} ${tile}`).toArray().sort().join('\n')
    }\n${tiles.map((tile,i) =>
       (i > 0 && i % CHUNK_SIZE === 0 ? '\n' : '')+   
      (tile === null ? ' ' : tileChars.get(tile))
         
    ).join('')}.`
    })
    .toArray().sort().join('\n\n') + '\n'
}

export function setTile (map: ChunkEntryMap, coord: Vec2, tile: TileId | null): void {
  const chunkCoord = { x: Math.floor(coord.x / CHUNK_SIZE), y: Math.floor(coord.y / CHUNK_SIZE) }
  const chunkKey = `${chunkCoord.x} ${chunkCoord.y}` as const
  if (tile === null && !map.has(chunkKey)) return
  const chunk = map.getOrInsertComputed(chunkKey, () => ({
    tileChars:new Map(),
    tiles:Array.from({length: CHUNK_SIZE*CHUNK_SIZE}, () =>null),
  }))
  const localCoord = {
    x: (coord.x % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE,
    y: (coord.y % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE,
  }
  const index  = localCoord.y * CHUNK_SIZE + localCoord.x
  if (index <0 || index >= CHUNK_SIZE * CHUNK_SIZE) {
    throw new RangeError(`bad math ${chunkKey} got index ${index} for ${coord.x}, ${coord.y}`)
  }
  const old = chunk.tiles[index]
  chunk.tiles[index] = tile
  if (tile === null) {
    if (old !== null && !chunk.tiles.includes(old)) {
      chunk.tileChars.delete(old)
      if (chunk.tileChars.size === 0) {
        map.delete(chunkKey)
      }
    }
  } else {
    if (!chunk.tileChars.has(tile)) {
      const chars = new Set(chunk.tileChars.values())
      let char
      findChar: {
        for (let i = '!'.codePointAt(0) ?? 0, end = '~'.codePointAt(0) ?? 0; i <= end; i++) {
          char = String.fromCodePoint(i)
          if (!chars.has(char)) {
            break findChar
          }
        }
        for (let i = '®'.codePointAt(0) ?? 0; ; i++) {
          char = String.fromCodePoint(i)
          if (!chars.has(char)) {
            break findChar
          }
        }
      }
      chunk.tileChars.set(tile, char)
    }
  }
}

export function deserializeTiles (text: string): ChunkEntryMap {
  const t = text.trim()
  if (!t) return new Map()
  return new Map(t.split(/\r?\n\r?\n/).map((chunk) => {
    const [key, ...lines] = chunk.split(/\r?\n/)
    const revCharMap = new Map(lines.slice(0, -CHUNK_SIZE).values().map(line => {
      const [char, tile] = line.split(' ')
      return [char, tileSchema.parse(tile)]
    }))
    const [x, y] = key.split(' ').map(Number)
    const tiles = lines.slice(-CHUNK_SIZE).values().flatMap(line => line.slice(0, CHUNK_SIZE).padEnd(CHUNK_SIZE)[Symbol.iterator]())
        .map(char => char === ' ' ? null : revCharMap.get(char) ?? null).toArray()
        if (tiles.length !== CHUNK_SIZE * CHUNK_SIZE) {
          throw new RangeError(`uh oh, bad chunk ${key} has ${tiles.length} tiles (expected ${CHUNK_SIZE * CHUNK_SIZE})`)
        }
        // tiles.pop() // the final . is to protect from trimming
    return [`${x} ${y}`, {
      tiles,
      tileChars: new Map(revCharMap.entries().map(([k,v])=>[v,k])),
    }]
  }))
}
