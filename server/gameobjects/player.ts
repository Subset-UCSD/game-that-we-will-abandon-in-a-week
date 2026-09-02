import { ev, isZeroVec, normalize, randomInCircle, scaleVec, subVec, type Vec2, vec2, vecLengthSquared } from "@common";
import type { BoxCollider } from "@common/colliders";
import { type GameObject, ItemId, KNIFE_OFFSET_Y, type Player as NetPlayer } from "@common/game";
import { defaultInputs, type Inputs } from "@common/input";
import type { Game } from "@server/game";
import { generateId } from "@server/id-manager";
import { Corpse } from "./corpse";
import type { StaticThing } from "./static-thing";

const MAX_HP = 67;
const LINE_START_AGE = 5_000;
const LINE_MAX_AGE = 10_000;

const SLEEP_TIME = 600000000000;

export class Player implements GameObject {
	inputs: Inputs;
	max_speed: number = 5;
	// represents player movement
	acceleration = vec2();
	position: Vec2 = scaleVec(randomInCircle(), 1000);
	velocity: Vec2 = { x: 0, y: 0 };
	id;
	static next_id = 0;
	game: Game;
	wasBaaing = false;
	wasInteracting = false;
	thought: string = "";
	hp: number = 67;
	maxHp = MAX_HP;
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
	nextFootsoundCanBePlayedAt = 0;
	dialogue?: {
		messagfe: string;
		options: string[];
		resopondTo: StaticThing;
	};
	optionIndex = 0;
	optionTimer = 0;
	// clouds = 0;
	// perhaps it should be Map<ItemId, {count:number}>
	// so you can just do player.inventory.getOrInsert(item, {count:0}).count++
	inventory = new Map<ItemId, number>([['knife',1],
	['meatball',67],
	['seed',1],
])

	constructor(game: Game) {
		this.game = game;
		this.inputs = { ...defaultInputs };
		this.id = generateId(); //Player.next_id++;
		this.collider = {
			width: 30,
			height: 30,
			position: this.position,
			offset: vec2(),
			rotation: 0,
			type: "box",
		};
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
		const v = vecLengthSquared(this.velocity) < 0.5 ? vec2() : this.velocity;
		const di = this.dialogue;
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
			maxHp: this.maxHp,
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
			dialogue: di && {
				messagfe: di.messagfe,
				options: di.options.map((option, i) => ({
					text: option,
					active: this.optionIndex % di.options.length === i ? this.optionTimer : undefined,
				})),
			},
			type: "player",
			items: this.inventory.entries().filter(([k,v])=>v>0).map(([item,count])=>({item,count})).toArray(),
		};
	}

	setInput(inputs: Inputs) {
		this.inputs = inputs;
	}

	// hint: player acceleration is set in server/Game.ts handlePlayerInput
	private static FRICTION = 6;
	tick() {
		// F = ma
		// https://en.wikipedia.org/wiki/Friction#Kinetic_friction
		// so friction is a constant acceleration i guess?

		// this assumes delta t = 1
		const oldVelocity = this.velocity;
		// apply friction first: a constant acceleration in the opposite direction
		// of velocity. but if friction would cause the velocity to change sign,
		// then set it to zero
		if (!isZeroVec(this.velocity)) {
			const friction = ev`${normalize(this.velocity)} * ${Math.pow(vecLengthSquared(this.velocity), 0.1)} * ${Player.FRICTION}`;

			// this.velocity = ev`${this.velocity} - ${friction}`;
			if (vecLengthSquared(friction) > vecLengthSquared(this.velocity)) {
				// friction is more than velocity, so set it to zero
				this.velocity = vec2();
			} else {
				this.velocity = ev`${this.velocity} - ${friction}`;
			}
		}
		// v = v0 + at (assumes constant acceleration but whatever)
		this.velocity = ev`${this.velocity} + ${this.acceleration}`;
		// x = x0 + average v * t
		const oldPos = this.position;
		this.position = ev`${this.position} + (${oldVelocity} + ${this.velocity}) / 2`;
		// if (!isVecEq(oldPos,this.position)) {
		// 	emit('players:move', [{id:`${this.id}`,...this.position}])
		// }

		if (this.hp <= 0) {
			this.hp = this.maxHp;
			this.game.addGameObject(
				new Corpse({
					...this.position,
					facingLeft: this.facingLeft,
				}),
			);
			// TODO: respawn
			this.position = scaleVec(randomInCircle(), 1000);
			this.inventory.set('meatball',(this.inventory.get('meatball')??0)+42)
		}
		if (this.seedCooldownTicks === 1) {
			this.inventory.set('seed', (this.inventory.get('seed')??0)+1)
		}
		this.seedCooldownTicks = Math.max(this.seedCooldownTicks - 1, 0);
		this.collider.position = subVec(this.position, { x: 0, y: 10 });

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

		if (this.optionTimer <= 0) {
			this.optionTimer = 40;
			this.optionIndex++;
		} else {
			this.optionTimer--;
		}
	}

	applyImpulse(impulse: Vec2): void {
		// TODO

		this.velocity = ev`${this.velocity} + ${impulse}`;
	}

	setHp(hp: number) {
		this.hp = hp;
	}
	getHp() {
		return this.hp;
	}

	//this might be a todo idk
	// TODO: MAKE KNIFE A GAMEOBJECT
	handleKnife() {
		// //
		// const KNIFE_DAMAGE = 5.5; // as proclaimed by nick
		// const knife = this.getKnifeLocation();
		// if (knife) {
		// 	const particle: Particle = {
		// 		color: [6, 89, 36],
		// 		count: 20,
		// 		x: knife.x,
		// 		y: knife.y,
		// 		lifetime: 500,
		// 		radius: 2,
		// 		xvSpread: 100,
		// 		yvSpread: 100,
		// 		yvBase: -100,
		// 		yvGravity: 500,
		// 	};
		// 	for (const entity of this.gameObjects) {
		// 		if (player === entity) continue;
		// 		if (entity instanceof Player) {
		// 			if (entity.collider knife) {
		// 				if (!player.knivesInside.has(entity)) {
		// 					player.knivesInside.add(entity);
		// 					entity.setHp(entity.getHp() - KNIFE_DAMAGE);
		// 					this.particleQueue.push(particle);
		// 					entity.applyImpulse(ev`${player.getKnifeVelocityDir()} * ${40}`);
		// 					// console.log(entity.velocity)
		// 				}
		// 			} else {
		// 				player.knivesInside.delete(entity);
		// 			}
		// 		} else if (entity instanceof StaticThing) {
		// 			if (entity.collider) {
		// 				if (entity.collider?.isInsideMe(knife)) {
		// 					if (!player.knivesInside.has(entity)) {
		// 						player.knivesInside.add(entity);
		// 						entity.takeDamageIfPossible(KNIFE_DAMAGE);
		// 						this.particleQueue.push(particle);
		// 					}
		// 				} else {
		// 					player.knivesInside.delete(entity);
		// 				}
		// 			}
		// 		} else if (entity instanceof Enemy) {
		// 			if (entity.collider) {
		// 				if (entity.collider?.isInsideMe(knife)) {
		// 					if (!player.knivesInside.has(entity)) {
		// 						player.knivesInside.add(entity);
		// 						entity.publicState.healthPoint -= KNIFE_DAMAGE
		// 						if (entity.publicState.healthPoint < 0) entity.publicState.healthPoint = 0
		// 						this.particleQueue.push(particle);
		// 						entity.applyImpulse(ev`${player.getKnifeVelocityDir()} * ${40}`);
		// 					}
		// 				} else {
		// 					player.knivesInside.delete(entity);
		// 				}
		// 			}
		// 		}
		// 	}
		// }
	}

	getKnifeLocation(): Vec2 | null {
		if (this.knifeState.radius < 10) {
			return null;
		}
		return ev`${this.position} + ${vec2(0, KNIFE_OFFSET_Y)} + ${vec2(Math.cos(this.knifeState.angle), Math.sin(this.knifeState.angle))} * ${this.knifeState.radius}`;
	}

	getKnifeVelocityDir(): Vec2 {
		// take derivative of above
		return vec2(Math.sin(this.knifeState.angle), -Math.cos(this.knifeState.angle));
	}
}
