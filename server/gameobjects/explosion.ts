import type { Explosion as ExplosionType, GameObject } from "@common/game";
import { generateId } from "@server/id-manager";

export type ExplosionProps = Omit<ExplosionType, "id" | "type"> & {
	duration: number;
};

let nextId = 0;
export class Explosion implements GameObject {
	partyId = "";
	public publicState: ExplosionType;
	public shouldDelete = false;
	private duration: number;

	constructor(props: ExplosionProps) {
		this.publicState = { ...props, id: generateId(), type: "explosion" };
		this.duration = props.duration;
	}

	tick(): void {
		if (this.shouldDelete) return;
		this.duration--;
		if (this.duration <= 0) this.shouldDelete = true;
	}

	serialize(): ExplosionType {
		return this.publicState;
	}

	get radius() {
		return this.publicState.radius;
	}
}
