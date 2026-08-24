/**
 * number of pixels per tile (we should adjust this once then never again)
 */
export const TILE_SIZE = 40

/**
 * map tile name to either
 * - string starting with `#` -> temporary solid color if no texture available
 * - path to asset (TODO: this should be handled separately)
 */
export const tileRegistry = {
  temp_dirt: '#4b3524',
  temp_water: '#285397',
} satisfies Record<string ,string>

export type TileId = keyof typeof tileRegistry
