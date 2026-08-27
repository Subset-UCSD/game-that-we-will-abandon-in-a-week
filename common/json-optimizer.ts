/**
 * @module
 * optimize JSON payload by only storing diff
 * result should then be re-parsed with Zod
 */

export type DiffPayload = unknown;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const DELETE = 0;
const REPLACE = 1;

export function generateDiffPayload(lastSent: unknown, newValue: unknown, keyState: string[]): DiffPayload {
	if (newValue === undefined) {
		if (lastSent !== undefined) {
			return [DELETE];
		} else {
			return undefined;
		}
	}
	if (isObject(lastSent)) {
		if (isObject(newValue)) {
			const result: Record<number, unknown> = {};
			let changes = 0;
			for (const key of new Set([...Object.keys(lastSent), ...Object.keys(newValue)])) {
				const payload = generateDiffPayload(lastSent[key], newValue[key], keyState);
				if (payload !== undefined) {
					let index = keyState.indexOf(key);
					if (index === -1) {
						keyState.push(key);
						index = keyState.length - 1;
					}
					result[index] = payload;
					changes++;
				}
			}
			return changes === 0 ? undefined : result;
		} else {
			return Array.isArray(newValue) ? [REPLACE, newValue] : newValue;
		}
	}
	if (Array.isArray(lastSent)) {
		if (Array.isArray(newValue)) {
			const result: Record<number | "l" | "e", unknown> = { l: undefined, e: undefined };
			let changed = lastSent.length !== newValue.length;
			if (lastSent.length > newValue.length) {
				result.l = newValue.length;
			} else if (newValue.length > lastSent.length) {
				result.e = newValue.slice(lastSent.length);
			}
			const commonLength = Math.min(lastSent.length, newValue.length);
			for (let i = 0; i < commonLength; i++) {
				const payload = generateDiffPayload(lastSent[i] ?? null, newValue[i] ?? null, keyState);
				if (payload !== undefined) {
					changed = true;
					result[i] = payload;
				}
			}
			return changed ? result : undefined;
		} else {
			return [REPLACE, newValue];
		}
	}
	if (Array.isArray(newValue)) {
		return [REPLACE, newValue];
	}
	return newValue === lastSent ? undefined : newValue;
}

export function applyDiffPayload(lastReceived: unknown, diff: DiffPayload, keyState: string[]): unknown {
	if (diff === undefined) {
		return lastReceived;
	}
	if (Array.isArray(diff)) {
		if (diff[0] === DELETE) {
			return undefined;
		} else if (diff[0] === REPLACE) {
			return diff[1];
		} else {
			throw new Error("what is this " + JSON.stringify(diff[0]));
		}
	}
	if (isObject(lastReceived)) {
		if (isObject(diff)) {
			const result = { ...lastReceived };
			for (const [key, value] of Object.entries(diff)) {
				const realKey = keyState[+key];
				const applied = applyDiffPayload(lastReceived[realKey], value, keyState);
				if (applied === undefined) {
					delete result[realKey];
				} else {
					result[realKey] = applied;
				}
			}
			return result;
		} else {
			return diff;
		}
	}
	if (Array.isArray(lastReceived)) {
		if (Array.isArray(diff)) {
			return diff[1];
		} else if (isObject(diff)) {
			const result = lastReceived.slice(0, typeof diff.l === "number" ? diff.l : undefined);
			if (Array.isArray(diff.e)) {
				result.push(...diff.e);
			}
			for (const [key, value] of Object.entries(diff)) {
				if (key === "l" || key === "e") continue;
				const index = +key;
				result[index] = applyDiffPayload(lastReceived[index], diff[index], keyState);
			}
			return result;
		} else {
			throw new Error("should not happen");
		}
	}
	return diff;
}
