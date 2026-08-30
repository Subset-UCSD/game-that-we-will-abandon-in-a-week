import { clamp, scaleVec, type Vec2, vec2 } from "@common";
import type { D20Schema, GameObject } from "@common/game";
import { CircleCollider } from "@common/colliders";
import { generateId } from "@server/id-manager";

const ROTATION_SPEED = 100;

export class D20 implements GameObject {
	partyId = "";
	publicState: D20Schema;
	collider: CircleCollider;
	shouldDelete: boolean = false;

	#moving = false;
	constructor() {
		this.publicState = {
			x: 200,
			y: -50,
			x_vel: 0,
			y_vel: 0,
			radius: 30,
			value: -1,
			type: "d20",
			id: generateId(),
		};
		this.collider = {
			type: "circle",
			offset: vec2(),
			position: {...this.publicState},
			radius: 2,
			rotation: 0,
		}
	}

	get state() {
		return this.publicState;
	}

	onCollide = (mts: Vec2) => {
		mts = clamp(scaleVec(mts, 5), 50);
		// console.log(this, this.publicState)
		this.publicState.x_vel = mts.x;
		this.publicState.y_vel = mts.y;
		this.#moving = true;
	};

	get id(): number {
		return this.publicState.id;
	}

	tick() {
		// console.log(this.publicState)
		if (this.#moving) {
			this.publicState.x_vel *= 0.9;
			this.publicState.y_vel *= 0.9;

			this.publicState.x += this.publicState.x_vel;
			this.publicState.y += this.publicState.y_vel;

			if (this.publicState.x_vel ** 2 + this.publicState.x_vel ** 2 < 0.1) {
				this.#moving = false;
				this.publicState.x_vel = 0;
				this.publicState.y_vel = 0;
			}
		}
		
		// 👍👍👍👍👍👍👍EYAn EYANNNNN GOOD !!!!
		this.collider.position = vec2(this.publicState.x, this.publicState.y) //GOD
			// SINFUL, ABHORORENT, EVIL, 	
			// TWO LEGS GOOD, 4 LEGS BAD
			// TWO LEGS GOOD, 4 LEGS BAD
			// TWO LEGS GOOD, 4 LEGS BAD
			// TWO LEGS GOOD, 4 LEGS BAD
			// TWO LEGS GOOD, 4 LEGS BAD
		// this.collider.updateLocation(vec2(this.publicState.x, this.publicState.y)); //EVIL
	}

	serialize(): D20Schema {
		return this.publicState;
	}
}

//   export interface GameObject {
//     shouldDelete: boolean;
//     collider?: Collider
//     tick(): void;
//     serialize(): unknown;
//   }
