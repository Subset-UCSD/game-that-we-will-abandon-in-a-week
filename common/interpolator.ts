/**
 * @module
 * larper
 */

import { SERVER_GAME_TICK } from "@common";

/**
 * larp
 * @param progress between 0 and 1
 */
export const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress;

const twopi = 2 * Math.PI;
/** interpolate the closer way */
export const lerpAngle = (a: number, b: number, progress: number): number => {
	a = ((a % twopi) + twopi) % twopi;
	b = ((b % twopi) + twopi) % twopi;
	// is it faster to go through 2pi?
	const candidate1 = Math.abs(a - b);
	const candidate2 = Math.abs(a + twopi - b);
	const candidate3 = Math.abs(a - (b + twopi));
	const min = Math.min(candidate1, candidate2, candidate3);
	if (min === candidate2) {
		return lerp(a + twopi, b, progress);
	}
	if (min === candidate3) {
		return lerp(a, b + twopi, progress);
	}
	return lerp(a, b, progress);
};

/**
 * this will delay showing the current value to the user and instead spend the
 * next `SERVER_GAME_TICK` smoothly animating from the current value to the new
 * value
 */
export class Interpolator<T> {
	#delay: number;
	#state: { from: T; to: T; endTime: number };
	#lerp: (from: T, to: T, progress: number) => T;

	constructor(initValue: T, lerp: (from: T, to: T, progress: number) => T, delay = SERVER_GAME_TICK) {
		this.#delay = delay;
		this.#lerp = lerp;
		this.#state = { from: initValue, to: initValue, endTime: 0 };
	}

	getValue(): T {
		const now = Date.now();
		if (now < this.#state.endTime) {
			const progress = Math.max(0, (now - (this.#state.endTime - this.#delay)) / this.#delay);
			return this.#lerp(this.#state.from, this.#state.to, progress);
		} else {
			return this.#state.to;
		}
	}

	setValue(value: T): void {
		const from = this.getValue();
		this.#state = { from, to: value, endTime: Date.now() + this.#delay };
	}

	static number(initValue: number, delay?: number): Interpolator<number> {
		return new Interpolator(initValue, lerp, delay);
	}
}
