/**
 * @module
 * The ID manager manages IDs
 */

let nextId = 0

export function generateId (): number {
  return nextId++
}
