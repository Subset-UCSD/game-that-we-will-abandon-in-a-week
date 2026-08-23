import { Canvas } from "./canvas";
import { loadFrames } from "./frames";
import { RenderableObject } from "./render";
import { Player as NetPlayer } from "@common";

const { base, walking, think, sleep } = await loadFrames({
	base: ["./assets/sheep.png", "./assets/sheep2.png"],
	walking: ["./assets/sheep-walk1.png", "./assets/sheep-walk2.png"],
	think: ["./assets/think1.png", "./assets/think2.png"],
	sleep: ["./assets/sheep-sleep1.png", "./assets/sheep-sleep2.png"]
} as const);

export const SHEEP_WIDTH = 60;

export const SLEEP_TIME = 10000;

export class Player implements RenderableObject {
	private props: NetPlayer;
	private lastFootstepTime: number;
	get index() { return this.props.y };

	constructor(props: NetPlayer) {
		this.props = props;
		this.lastFootstepTime = Date.now();
	}

	renderShadow({ c }: Canvas) {
		const { x, y } = this.props;
		c.moveTo(x + SHEEP_WIDTH * 0.4, y);
		c.ellipse(x, y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI * 2);
	}

	render({ c }: Canvas): void {
		const { id, x, y, x_vel, y_vel, timeSinceLastInput, healthpercent, thought } = this.props;
		const sleeping = timeSinceLastInput > SLEEP_TIME;
		const shouldFlipX = x_vel < 0;
		/** in milliseconds */
		const isMoving = Math.hypot(x_vel, y_vel) > 0.1
		const TIME_PER_FRAME = (sleeping ? 770 : isMoving ? 50 : 500) + (id * Math.PI) % 50
		const framesList = sleeping ? sleep : isMoving ? walking : base
		const frame = framesList[Math.floor(Date.now() / TIME_PER_FRAME) % framesList.length]
		// changed to be in handleInput, so we keep old direction if we stop moving
		// const shouldFlipX = this.x_vel < 0

		const TIME_PER_FRAME_THOUGHT = 600
		const frameThought = think[Math.floor(Date.now() / (TIME_PER_FRAME_THOUGHT + (id * Math.PI) % 50)) % think.length]

		const THOUGHT_WIDTH = 60
		const THOUGHT_HEIGHT = 50
		if (shouldFlipX) {
			c.save()
			c.scale(-1, 1)
			c.drawImage(frame, -(x) - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);
			c.restore()

		} else {
			c.drawImage(frame, x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50);
		}

		if (healthpercent < 1) {
			c.fillStyle = '#ff025f'
			c.fillRect(x - 20, y - 10 - 42, 40 * (healthpercent), 5)
			c.strokeStyle = 'black'
			c.strokeRect(x - 20.5, y - 10.8 - 42, 41, 6)
		}

		if (thought) {
			c.drawImage(frameThought, x + SHEEP_WIDTH / 2, y - THOUGHT_HEIGHT - 42, THOUGHT_WIDTH, THOUGHT_HEIGHT);
			c.fillStyle = 'black'
			c.fillText(thought, x + SHEEP_WIDTH / 2 + 20, y - 25 - 42)
		}

		c.strokeStyle = 'green'
		c.rect(x - SHEEP_WIDTH / 2, y - 42, SHEEP_WIDTH, 50)
	}

	update(props: NetPlayer): void {
		this.props = props;
	}
}