import { Interpolator } from "@common";
import type { MeatBall } from "@common/game";
import type { Canvas } from "./canvas";
import { loadFrames } from "./frames";
import type { RenderableObject } from "./render";

const frames = await loadFrames(["./assets/meatball1.png", "./assets/meatball2.png"]);

export class ClientMeatball implements RenderableObject {
	#id?: number;
	#x?: Interpolator<number>;
	#y?: Interpolator<number>;
	#height?: Interpolator<number>;

	get index() {
		return this.#y?.getValue() ?? 0;
	}

	update({ id, x, y, height }: MeatBall): void {
		this.#id = id;
		this.#x ??= Interpolator.number(x);
		this.#x.setValue(x);
		this.#y ??= Interpolator.number(y);
		this.#y.setValue(y);
		this.#height ??= Interpolator.number(height);
		this.#height.setValue(height);
	}

	renderShadow({ c }: Canvas): void {
		if (!this.#x || !this.#y) return;
		const x = this.#x.getValue();
		const y = this.#y.getValue();
		c.moveTo(x + 5, y);
		c.ellipse(x, y, 5, 2, 0, 0, Math.PI * 2);
	}

	render({ c }: Canvas) {
		if (this.#id === undefined || !this.#x || !this.#y || !this.#height) return;
		const x = this.#x.getValue();
		const y = this.#y.getValue();
		const height = this.#height.getValue();
		const frame = frames[Math.floor(Date.now() / (470 + ((this.#id * Math.PI) % 50))) % frames.length];
		const R = 7; // radius (maybe)
		c.drawImage(frame, x - R, y - R - 3 - height, R * 2, R * 2);
	}
}
