import type { Enemy, SerializedGameObject } from "@common/game";
import type { Canvas } from "./canvas";
import { SHEEP_WIDTH } from "./player";
import type { RenderableObject } from "./render";

const frames = await Promise.all(
	["./assets/enemy1.png", "./assets/enemy2.png"].map(
		async (url) => await createImageBitmap(await fetch(url).then((r) => r.blob())),
	),
);

export class Anemone implements RenderableObject {
	state?: Enemy;

	get index() {
		return this.state?.y ?? 0;
	}

	renderShadow({ c }: Canvas): void {
		if (!this.state) return;
		const { x, y } = this.state;
		c.moveTo(x + SHEEP_WIDTH * 0.4, y);
		c.ellipse(x, y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI * 2);
	}

	render({ c }: Canvas) {
		if (!this.state) return;

		const frame = frames[Math.floor(Date.now() / (770 + ((this.state.id * Math.PI) % 50))) % frames.length];

		const { x, y,healthPMax,healthPoint } = this.state;

		c.drawImage(frame, x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);

		
		if (healthPMax !== undefined && healthPoint !== undefined) {
			const actualhealthpercent = healthPoint / healthPMax;
			if (actualhealthpercent < 1) {
				c.fillStyle = "#ff025f";
				c.fillRect(x - 20, y - 10  - 42, 40 * actualhealthpercent, 5);
				c.strokeStyle = "black";
				c.strokeRect(x - 20.5, y - 10.8 - 42 , 41, 6);
			}
		}
	}

	update(objState: SerializedGameObject): void {
		if (objState.type !== "enemy") return;
		this.state = objState;
	}
}
