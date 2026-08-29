import type { GameObject, SerializedThing, Vec2 } from "@common";
import type { Collider } from "@server/collision";
import { generateId } from "@server/id-manager";
import { Player } from "./player";

/**
 * for things that don't move ("static") like trees, signs, and tech bros ig
 */
export class StaticThing implements GameObject {
	static #nextId = 0;
	#state: SerializedThing;
	shouldDelete = false;
	collider?: Collider;
	partyId = "";

	constructor({ collider, ...thing }: Omit<SerializedThing, "id" | "type"> & { collider?: Collider }) {
		this.#state = {
			id: generateId(),
			type: "thing",
			...thing,
		};
		this.collider = collider;
	}

	tick(): void {
		// static things dont do anything
	}

	serialize(): SerializedThing {
		return this.#state;
	}

	get id(): number {
		return this.#state.id;
	}

	get position(): Vec2 {
		return this.#state;
	}

	get interactive(): boolean {
		return this.#state.interactive ?? false;
	}

	takeDamageIfPossible(damage: number): void {
		if (this.#state.hp !== undefined) {
			this.#state.hp = Math.max(0, this.#state.hp - damage);
		}
	}

	interact (player:Player, option: string|null): void {}
}
