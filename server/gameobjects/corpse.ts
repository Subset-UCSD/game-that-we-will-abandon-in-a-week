import type { Player } from "./player";
import { StaticThing } from "./static-thing";

export class Corpse extends StaticThing {
	partyId = "";
	static #nextId = 0;
	shouldDelete = false;
	// #publicState: SerializedCorpse;

	constructor({ x, y, facingLeft }: { x: number; y: number; facingLeft: boolean }) {
		super({ kind: facingLeft ? "corpse-left" : "corpse", x, y, interactive: true });
		// this.#publicState = { ...publicState, id: generateId(), type: "corpse" };
	}

	// get id(): number {
	// 	return this.#publicState.id;
	// }

	tick(): void {
		// TODO
	}

	// serialize(): SerializedCorpse {
	// 	return this.#publicState;
	// }

	*logic(player: Player): Generator<{ message: string; options: string[] }, void, string> {
		yield { message: "hello iam the courpse  anyways congratulations you have now a cloud", options: ["thanks"] };
	}

	interact(player: Player, option: string | null): void {
		super.interact(player, option);
		if (!player.dialogue) {
			// they have finished convo so give them a cloud
			player.clouds++;
			this.shouldDelete = true;
		}
	}
}
