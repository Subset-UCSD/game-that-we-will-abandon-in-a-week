import type { GameObject, SerializedCorpse } from "@common/game";
import { generateId } from "@server/id-manager";

export class Corpse implements GameObject {
	partyId = "";
	static #nextId = 0;
	shouldDelete = false;
	#publicState: SerializedCorpse;

	constructor(publicState: Omit<SerializedCorpse, "id" | "type">) {
		this.#publicState = { ...publicState, id: generateId(), type: "corpse" };
	}

	get id(): number {
		return this.#publicState.id;
	}

	tick(): void {
		// TODO
	}

	serialize(): SerializedCorpse {
		return this.#publicState;
	}
}
