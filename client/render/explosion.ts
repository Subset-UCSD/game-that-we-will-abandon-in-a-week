import type { Explosion, SerializedGameObject, Vec2 } from "@common";
import type { Canvas } from "./canvas";
import type { RenderableObject } from "./render";

const EXPLOSION_ANIM_MAX_AGE = 1000;

export class ClientExplosion implements RenderableObject {
	#explosion: Explosion = {
		x: 0,
		y: 0,
		radius: 0,
		type: "explosion",
		id: 0,
	};
	#created = Date.now();
	get position(): Vec2 {
		return this.#explosion;
	}

	get index() {
		return this.#explosion.y;
	}
	// get shouldDie () { return Date.now() - this.#created >= EXPLOSION_ANIM_MAX_AGE }
	get progress() {
		return Math.min(1, (Date.now() - this.#created) / EXPLOSION_ANIM_MAX_AGE);
	}

	render({ c }: Canvas) {
		const { x, y, radius } = this.#explosion;
		const progress = this.progress;
		c.fillStyle = `rgba(255, ${progress * 255}, ${progress * 255}, ${1 - progress})`;
		c.beginPath();
		c.moveTo(x + radius, y);
		c.arc(x, y, radius, 0, 2 * Math.PI);
		c.fill();
	}

	update(objState: SerializedGameObject): void {
		if (objState.type !== "explosion") return;
		this.#explosion = objState;
	}

	shouldRemove(): boolean {
		return Date.now() - this.#created >= EXPLOSION_ANIM_MAX_AGE;
	}
}
