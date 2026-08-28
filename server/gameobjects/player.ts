import { clamp, ev, isZeroVec, normalize, subVec, type Vec2, vec2, vecLengthSquared } from "@common";
import { type GameObject, KNIFE_OFFSET_Y, type Player as NetPlayer } from "@common/game";
import { defaultInputs, type Inputs } from "@common/input";
import { BoxCollider } from "@server/collision";
import type { Game } from "@server/game";
import { generateId } from "@server/id-manager";
import { Corpse } from "./corpse";

const MAX_HP = 67;
const LINE_START_AGE = 5_000;
const LINE_MAX_AGE = 10_000;

const SLEEP_TIME = 60_000;

export class Player implements GameObject {
	inputs: Inputs;
	max_speed: number = 5;
	// represents player movement
	acceleration = vec2()
	position: Vec2 = { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000 };
	velocity: Vec2 = { x: 0, y: 0 };
	id;
	static next_id = 0;
	game: Game;
	wasBaaing = false;
	wasInteracting = false;
	thought: string = "";
	hp: number = 67;
	facingLeft = false;
	connected = false;
	lastInputTime = 0;
	lines: { start: Vec2; end: Vec2; committed?: number }[] = [];
	shouldDelete = false;
	seedCooldownTicks = 0;
	collider: BoxCollider;
	collied: boolean = false;
	/**
	 * list of static thing IDs
	 * it's an array because you could be standing next to multiple interactive things
	 * not sure if we want it to be click or space (i think space makes more sense because you have to walk up to the object to interact)
	 * TODO: in that case we should change this to just a number
	 */
	canInteractWith: number[] = [];
	partyId = "";
	roomId: string = "base";
	wasTeleporting = false;
	private knifeState = { angle: 0, radius: 0 };
	knivesInside = new Set<GameObject>();
	nextFootsoundCanBePlayedAt = 0

	constructor(game: Game) {
		this.game = game;
		this.inputs = { ...defaultInputs };
		this.id = generateId(); //Player.next_id++;
		this.collider = new BoxCollider(
			this.position.x,
			this.position.y - 20,
			30,
			30,
			0
		);
	}

	setPosition(x: number, y: number) {
		this.position = { x, y };
	}
	getPosition() {
		return this.position;
	}

	setInputs(newInputs: Inputs) {
		// @ts-expect-error
		if (Object.entries(this.inputs).some(([key, value]) => newInputs[key] !== value)) {
			this.lastInputTime = Date.now();
		}
		this.inputs = { ...newInputs };
		// this.handleInput(this.inputs);
	}
	getInputs() {
		return this.inputs;
	}

	serialize(): NetPlayer {
		return {
			...this.position,
			x_vel: this.velocity.x,
			y_vel: this.velocity.y,
			id: this.id,
			roomId: this.roomId,
			baaing: this.thought,
			facingLeft: this.facingLeft,
			connected: this.connected,
			// round down to nearest second because client doesnt need that much granularity
			// nvm
			probablyafk: ((Date.now() - this.lastInputTime) / 1000) * 1000 > SLEEP_TIME,
			healthpercent: this.hp,
			maxHp: MAX_HP,
			lines: this.lines.map(({ start, end, committed }) => ({
				start,
				end,
				age: committed ? Math.min(1, Math.max(0, (Date.now() - (committed + LINE_START_AGE)) / LINE_MAX_AGE)) : null,
			})),
			collied: this.collied,
			canInteractWith: this.canInteractWith,
			knifeRadius: +this.knifeState.radius.toFixed(3),
			knifeAngle: this.knifeState.angle,
			thought: this.thought,
			type: "player",
		};
	}

	setInput(inputs: Inputs) {
		this.inputs = inputs;
	}

	private static FRICTION = 10
	tick() {
		// F = ma
		// https://en.wikipedia.org/wiki/Friction#Kinetic_friction
		// so friction is a constant acceleration i guess?

		// this assumes delta t = 1
		const oldVelocity = this.velocity
		// apply friction first: a constant acceleration in the opposite direction
		// of velocity. but if friction would cause the velocity to change sign,
		// then set it to zero
		if (!isZeroVec(this.velocity)) {
			const friction = ev`${normalize(this.velocity)} * ${Player.FRICTION}`
			if (vecLengthSquared(friction) > vecLengthSquared(this.velocity)) {
				// friction is more than velocity, so set it to zero
				this.velocity = vec2()
			} else {
				this.velocity = ev`${this.velocity} - ${friction}`
			}
		}
		// v = v0 + at (assumes constant acceleration but whatever)
		this.velocity = ev`${this.velocity} + ${this.acceleration}`;
		// x = x0 + average v * t
		this.position = ev`${this.position} + (${oldVelocity} + ${this.velocity}) / 2`;

		if (this.hp <= 0) {
			this.hp = MAX_HP;
			this.game.addGameObject(
				new Corpse({
					...this.position,
					facingLeft: this.facingLeft,
				}),
			);
			// TODO: respawn
			this.position = { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000 };
		}
		this.seedCooldownTicks = Math.max(this.seedCooldownTicks - 1, 0);
		this.collider.updateLocation(subVec(this.position, { x: 0, y: 10 }));
		const MAX_RADIUS = 30;
		if (this.inputs.knife) {
			this.knifeState.radius += (MAX_RADIUS - this.knifeState.radius) * 0.3;
		} else if (this.knifeState.radius > 0) {
			this.knifeState.radius += (MAX_RADIUS * 1.5 - this.knifeState.radius) * -0.3;
			if (this.knifeState.radius < 0) {
				this.knifeState.radius = 0;
			}
		}
		if (this.knifeState.radius > 0) {
			this.knifeState.angle += -0.2;
		}
	}













applyImpulse (impulse: Vec2): void {




// TODO



this.velocity = ev`${this.velocity} + ${impulse}`










}



























	setHp(hp: number) {
		this.hp = hp;
	}
	getHp() {
		return this.hp;
	}

	getKnifeLocation(): Vec2 | null {
		if (this.knifeState.radius < 10) {
			return null;
		}
		return ev`${this.position} + ${vec2(0, KNIFE_OFFSET_Y)} + ${vec2(Math.cos(this.knifeState.angle), Math.sin(this.knifeState.angle))} * ${this.knifeState.radius}`;
	}

	getKnifeVelocityDir (): Vec2 {
		// take derivative of above
		return vec2(Math.sin(this.knifeState.angle), -Math.cos(this.knifeState.angle))
	}
}
