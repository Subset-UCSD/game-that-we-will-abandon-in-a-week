/**
 * @module
 * optimize JSON payload by only storing diff
 * result should then be re-parsed with Zod
 */

export type DiffPayload = unknown

export function generateDiffPayload (lastSent: unknown, newValue: unknown): DiffPayload {
  return // idk
}

export function applyDiffPayload (lastReceived: unknown, diff: DiffPayload): unknown {
  return // idk
}
