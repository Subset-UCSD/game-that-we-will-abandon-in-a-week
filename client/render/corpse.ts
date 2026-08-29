import type { SerializedCorpse, SerializedGameObject } from "@common/game";
import type { Canvas } from "./canvas";
import { SHEEP_WIDTH } from "./player";
import type { RenderableObject } from "./render";
import { ThingRenderer } from "./thing-renderer";

const frames = await Promise.all(
	["./assets/what-do-sheep-become-when-they-die1.png", "./assets/what-do-sheep-become-when-they-die2.png"].map(
		async (url) => await createImageBitmap(await fetch(url).then((r) => r.blob())),
	),
);

export class ClientCorpse extends ThingRenderer {
	// index = 1;
	// state?: SerializedCorpse;


	renderShadow({ c }: Canvas): void {
		if (!this.thing) return;
		const { x, y } = this.thing;
		c.moveTo(x + SHEEP_WIDTH * 0.4, y);
		c.ellipse(x, y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI * 2);
	}

	render({ c }: Canvas) {
		if (!this.thing) return;

		const frame = frames[Math.floor(Date.now() / (770 + ((this.thing.id * Math.PI) % 50))) % frames.length];

		const { x, y } = this.thing;
		const offset = Math.sin(Date.now() / (900 + ((this.thing.id * Math.PI) % 100))) * 5;
		if (this.thing.kind==='corpse-left') {
			c.save();
			c.scale(-1, 1);
			c.drawImage(frame, -x - SHEEP_WIDTH / 2, y - 42 + offset, SHEEP_WIDTH, 50);
			c.restore();
		} else {
			c.drawImage(frame, x - SHEEP_WIDTH / 2, y - 42 + offset, SHEEP_WIDTH, 50);
		}
	}

	// update(objState: SerializedGameObject): void {
	// 	if (objState.type !== "corpse") return;
	// 	this.state = objState;
	// }
}
