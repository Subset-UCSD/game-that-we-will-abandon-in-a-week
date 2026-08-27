import type { Camera } from "@client/game";
import type { Canvas } from "@client/render";
import { addVec, ev, type Vec2 } from "@common";
import { TILE_SIZE, type TileId, tileSchema } from "@common/tiles";

export class DebugTileEditor {
	#enabled = false;
	#mouse?: Vec2;
	#mouseInWorld?: Vec2;
	#mouseDown?: Set<`${number} ${number}`>;
	#radius = 0;
	#tile: TileId | null = "grass";
	isRenderCollider = false;

	constructor() {
		const wrapper = Object.assign(document.createElement("div"), {
			className: "debug-tile-editor",
		});

		const slider = Object.assign(document.createElement("input"), {
			type: "range",
			min: 0,
			max: 5,
			value: 0,
		});
		wrapper.append(slider);
		slider.addEventListener("input", () => {
			this.#radius = slider.valueAsNumber;
		});

		const select = document.createElement("select");
		select.append(
			Object.assign(document.createElement("option"), {
				textContent: "V O I D",
				value: "",
			}),
		);
		for (const option of tileSchema.values) {
			select.append(
				Object.assign(document.createElement("option"), {
					textContent: option,
					value: option,
				}),
			);
		}
		select.value = this.#tile ?? "";
		wrapper.append(select);
		select.addEventListener("change", () => {
			this.#tile = select.value === "" ? null : tileSchema.parse(select.value);
		});

		const button = Object.assign(document.createElement("button"), {
			textContent: "toggle tile editing",
		});
		button.addEventListener("click", () => {
			this.#enabled = !this.#enabled;
			this.isRenderCollider = !this.isRenderCollider;
			if (!this.#enabled) {
				this.#mouse = undefined;
				this.#mouseDown = undefined;
			}
		});

		wrapper.append(button);

		document.addEventListener("pointerdown", (e) => {
			if (!(e.target instanceof Element) || !e.target.closest("canvas")) return;
			this.#mouseDown = new Set();
		});
		document.addEventListener("pointerup", (e) => {
			this.#mouseDown = undefined;
		});
		document.addEventListener("pointercancel", (e) => {
			this.#mouseDown = undefined;
		});
		document.addEventListener("pointermove", (e) => {
			this.#mouse = { x: e.clientX, y: e.clientY };
		});

		document.body.append(wrapper);
	}

	render({ c, width, height }: Canvas, camera: Camera): { vecs: Vec2[]; tile: TileId | null } | undefined {
		if (!this.#enabled) {
			return;
		}

		if (this.#mouse) {
			const mouseInWorld = ev`(${this.#mouse} - ${{ x: width / 2, y: height / 2 }}) / ${camera.scale} + ${camera}`;
			this.#mouseInWorld = { x: Math.floor(mouseInWorld.x / TILE_SIZE), y: Math.floor(mouseInWorld.y / TILE_SIZE) };
			c.fillStyle = "rgba(255, 255, 255, 0.1)";
			c.fillRect(
				(this.#mouseInWorld.x - this.#radius) * TILE_SIZE,
				(this.#mouseInWorld.y - this.#radius) * TILE_SIZE,
				TILE_SIZE * (this.#radius * 2 + 1),
				TILE_SIZE * (this.#radius * 2 + 1),
			);
			if (this.#mouseDown) {
				const vecs: Vec2[] = [];
				for (let x = -this.#radius; x <= this.#radius; x++)
					for (let y = -this.#radius; y <= this.#radius; y++) {
						const sum = addVec(this.#mouseInWorld, { x, y });
						if (!this.#mouseDown.has(`${sum.x} ${sum.y}`)) vecs.push(sum);
					}
				// const key = `${this.#mouseInWorld.x} ${this.#mouseInWorld.y}` as const
				if (vecs.length) {
					for (const { x, y } of vecs) {
						this.#mouseDown.add(`${x} ${y}`);
					}

					return {
						vecs,
						tile: this.#tile,
					};
				}
			}
		} else {
			this.#mouseInWorld = undefined;
		}

		const left = camera.x - width / camera.scale / 2;
		const right = camera.x + width / camera.scale / 2;
		const startX = Math.ceil((left - TILE_SIZE / 2) / TILE_SIZE);
		const endX = Math.floor((right - TILE_SIZE / 2) / TILE_SIZE);

		const top = camera.y - height / camera.scale / 2;
		const bottom = camera.y + height / camera.scale / 2;
		const startY = Math.ceil((top - TILE_SIZE / 2) / TILE_SIZE);
		const endY = Math.floor((bottom - TILE_SIZE / 2) / TILE_SIZE);
		// console.log(startX,endX,startY,endY)

		c.strokeStyle = "rgba(0, 0, 0, 0.1)";
		c.beginPath();
		for (let x = startX; x <= endX; x++) {
			c.moveTo(x * TILE_SIZE + TILE_SIZE / 2, top);
			c.lineTo(x * TILE_SIZE + TILE_SIZE / 2, bottom);
		}
		for (let y = startY; y <= endY; y++) {
			c.moveTo(left, y * TILE_SIZE + TILE_SIZE / 2);
			c.lineTo(right, y * TILE_SIZE + TILE_SIZE / 2);
		}
		c.stroke();
	}
}
