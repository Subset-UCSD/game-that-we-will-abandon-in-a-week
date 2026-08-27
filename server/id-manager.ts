/**
 * @module
 * The ID manager manages IDs
 */

let nextId = 0;

/**
 * generates a globally unqiue ID
 */
export function generateId(): number {
	return nextId++;
}
