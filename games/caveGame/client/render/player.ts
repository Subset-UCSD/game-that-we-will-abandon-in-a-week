/**
 * this class is a RENDER only class so if you add non-render logic here (such as audio),
 * i will DELETE it since it should probably go in a different file or client/game.ts
 */

import { Interpolator, KNIFE_OFFSET_Y, lerpAngle, type Player as NetPlayer } from "@common";
import type { Canvas } from "./canvas";
import { loadFrames } from "./frames";
import type { RenderableObject } from "./render";

const {
	base,
	walking,
	think,
	sleep,
	knife: [knife],
} = await loadFrames({
	base: ["./assets/sheep.png", "./assets/sheep2.png"],
	walking: ["./assets/sheep-walk1.png", "./assets/sheep-walk2.png"],
	think: ["./assets/think1.png", "./assets/think2.png"],
	sleep: ["./assets/sheep-sleep1.png", "./assets/sheep-sleep2.png"],
	knife: ["./assets/dager.png"],
} as const);

export const SHEEP_WIDTH = 60;

export class Player implements RenderableObject {
	private props?: NetPlayer;
	private x?: Interpolator<number>;
	private y?: Interpolator<number>;
	private knifeAngle?: Interpolator<number>;
	private knifeRadius?: Interpolator<number>;
	get index() {
		return this.y?.getValue() ?? 0;
	}

	constructor() {}

	renderShadow({ c }: Canvas) {
		if (!this.x || !this.y) return;
		const x = this.x.getValue();
		const y = this.y.getValue();
		c.moveTo(x + SHEEP_WIDTH * 0.4, y);
		c.ellipse(x, y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI * 2);
	}

	render({ c }: Canvas): void {
		if (!this.x || !this.y || !this.props) return;
		const x = this.x.getValue();
		const y = this.y.getValue();
		const {
			id,
			x_vel,
			y_vel,
			facingLeft,
			probablyafk,
			healthpercent,
			maxHp,
			thought,
			connected,
			knifeAngle,
			knifeRadius,
			dialogue,
		} = this.props;
		const sleeping = probablyafk || !connected;
		/** in milliseconds */
		const isMoving = Math.hypot(x_vel, y_vel) > 0.1;
		const TIME_PER_FRAME = (sleeping ? 770 : isMoving ? 50 : 500) + ((id * Math.PI) % 50);
		const framesList = sleeping ? sleep : isMoving ? walking : base;
		const frame = framesList[Math.floor(Date.now() / TIME_PER_FRAME) % framesList.length];
		// changed to be in handleInput, so we keep old direction if we stop moving
		// const shouldFlipX = this.x_vel < 0

		// const knifeRadius = this.knifeRadius.getValue()
		// const knifeAngle = this.knifeAngle.getValue()
		if (knifeRadius > 0) {
			c.save();
			c.translate(x, y + KNIFE_OFFSET_Y);
			c.rotate(knifeAngle);
			const KNIFE_WIDTH = 20;
			const KNIFE_HEIGHT = 15;
			c.drawImage(knife, -KNIFE_WIDTH / 2, knifeRadius - KNIFE_HEIGHT / 2, KNIFE_WIDTH, KNIFE_HEIGHT);
			c.restore();
		}

		const TIME_PER_FRAME_THOUGHT = 600;
		const frameThought =
			think[Math.floor(Date.now() / (TIME_PER_FRAME_THOUGHT + ((id * Math.PI) % 50))) % think.length];

		const THOUGHT_WIDTH = 60;
		const THOUGHT_HEIGHT = 50;
		if (facingLeft) {
			c.save();
			c.scale(-1, 1);
			c.drawImage(frame, -x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);
			c.restore();
		} else {
			c.drawImage(frame, x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);
		}

		const actualhealthpercent = healthpercent / maxHp;
		if (actualhealthpercent < 1) {
			c.fillStyle = "#ff025f";
			c.fillRect(x - 20, y - 10 - 42, 40 * actualhealthpercent, 5);
			c.strokeStyle = "black";
			c.strokeRect(x - 20.5, y - 10.8 - 42, 41, 6);
		}

		const realThought = connected ? thought || (dialogue ? "..." : "") : "ded";
		if (realThought) {
			c.drawImage(frameThought, x + SHEEP_WIDTH / 2, y - THOUGHT_HEIGHT - 42, THOUGHT_WIDTH, THOUGHT_HEIGHT);
			c.fillStyle = "black";
			c.fillText(realThought, x + SHEEP_WIDTH / 2 + 20, y - 25 - 42);
		}

		c.strokeStyle = "green";
		c.rect(x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);
	}

	update(props: NetPlayer): void {
		this.props = props;

		this.x ??= Interpolator.number(props.x);
		this.y ??= Interpolator.number(props.y);
		this.knifeRadius ??= Interpolator.number(props.knifeRadius);
		this.knifeAngle ??= new Interpolator(props.knifeAngle, lerpAngle);

		this.x.setValue(props.x);
		this.y.setValue(props.y);
		this.knifeAngle.setValue(props.knifeAngle);
		this.knifeRadius.setValue(props.knifeRadius);
	}
}
