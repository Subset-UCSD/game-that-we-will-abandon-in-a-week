import {
	type Collider,
	type GameObject,
	type SerializedGameObject,
	type SerializedThing,
	type Vec2,
	vec2,
} from "@common";
import { generateId } from "@server/id-manager";
import type { Player } from "./player";

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
			...thing,
			id: generateId(),
			type: "thing",
		};
		this.collider = collider;
	}

	tick(): void {
		// static things dont do anything
	}

	serialize(): SerializedGameObject {
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

	#playerState = new Map<Player, Generator<{ message: string; options: string[] }, void, string>>();
	*logic(player: Player): Generator<{ message: string; options: string[] }, void, string> {
		//
	}

	// this is extremely unergonomic and no one is going to use this shtiy siystsem
	interact(player: Player, option: string | null): void {
		const state = this.#playerState.getOrInsertComputed(player, () => this.logic(player));
		let resultresult = state.next(option ?? "");
		if (resultresult.done) {
			player.dialogue = undefined;
			this.#playerState.delete(player);
		} else {
			player.dialogue = {
				messagfe: resultresult.value.message,
				options: resultresult.value.options,
				resopondTo: this,
			};
		}
		// while ((result = state.next(option ?? ''), !result.done)) {
		// }
	}
}

export class Carrot extends StaticThing {
	constructor(position: Vec2) {
		super({
			...position,
			kind: "turnip",
			interactive: true,
			collider: { type: "circle", radius: 10, position, offset: vec2(0, -10), rotation: 0 },
		});
	}

	*logic(player: Player): Generator<{ message: string; options: string[] }, void, string> {
		const result = yield { message: "looks like it was just a caroot", options: ["accept all", "reject all"] };
		if (result.includes("accept")) {
			player.inventory.set("turnip", (player.inventory.get("turnip") ?? 0) + 1);
			this.shouldDelete = true;
		}
	}
}
