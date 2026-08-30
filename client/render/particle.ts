import { ev, type Particle, randomInCircle, type SerializedGameObject, type Vec2, vec2 } from "@common";
import type { Canvas } from "./canvas";

// i think particles will always render on top
// should they be clipped when they go behind ?
export class ClientParticle /*implements RenderableObject*/ {
	#color: { h: number; s: number; l: number };
	#position: Vec2;
	#velocity: Vec2;
	#acceleration: Vec2;
	dieTime: number;
	#radius: number;
	#lifetime: number;
	constructor({
		color: [h, s, l],
		x,
		y,
		xvSpread = 0,
		yvBase = 0,
		yvGravity = 0,
		yvSpread = 0,
		lifetime,
		radius,
	}: Omit<Particle, "count">) {
		this.#color = { h, s, l };
		this.#position = { x, y };
		// todo: it looks very rectangular, needs elliptic sampling i think
		this.#velocity = ev`${randomInCircle()} * ${vec2(xvSpread, yvSpread)} + ${vec2(0, yvBase)}`;
		// this.#xv=(xvSpread * (Math.random()* 2 - 1))
		// this.#yv=yvBase + (yvSpread * (Math.random()* 2 - 1))
		this.#acceleration = vec2(0, yvGravity);
		this.dieTime = Date.now() + lifetime;
		this.#lifetime = lifetime;
		this.#radius = radius;
	}

	/**
	 *
	 * @param dt delta time in SECONDS!!
	 */
	tick(dt: number) {
		// kinematic equations
		/// source: https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-sheet.pdf
		// this.#position.x += this.#velocity.x * dt
		// this.#position.y += this.#velocity.y * dt + this.#yAccel /2 * dt * dt
		this.#position = ev`${this.#position} + ${this.#velocity} * ${dt} + ${this.#acceleration} / 2 * ${dt * dt}`;
		// this.#yv += this.#yAccel * dt
		this.#velocity = ev`${this.#velocity} + ${this.#acceleration} * ${dt}`;
	}

	get index() {
		return this.#position.y;
	}

	render({ c }: Canvas): void {
		c.globalAlpha = (this.dieTime - Date.now()) / this.#lifetime;
		c.fillStyle = `hsl(${this.#color.h}, ${this.#color.s}%, ${this.#color.l}%)`;
		c.beginPath();
		const { x, y } = this.#position;
		c.moveTo(x + this.#radius, y);
		c.arc(x, y, this.#radius, 0, 2 * Math.PI);
		c.fill();
		c.globalAlpha = 1;
	}

	shouldRemove(): boolean {
		return Date.now() >= this.dieTime;
	}

	update(objState: SerializedGameObject): void {
		// not relevant
	}
}
