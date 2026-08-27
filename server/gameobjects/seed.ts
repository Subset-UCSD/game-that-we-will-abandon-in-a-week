import type { GameObject, Seed as SeedType } from "@common/game";
import { generateId } from "@server/id-manager";

export type SeedProps = Omit<SeedType, "id" | "type">;

const AVG_GROW_TICKS = 1000;
const AVG_GROW_DEVIATION = 200;
export const SEED_COOLDOWN = 500;

let nextId = 0;
export class Seed implements GameObject {
	public publicState: SeedType;
	public shouldDelete = false;
	private ticksUntilNextStage: number;
	partyId = "";

	constructor(props: SeedProps) {
		this.publicState = { ...props, id: generateId(), type: "seed" };
		this.ticksUntilNextStage = Math.floor(
			AVG_GROW_TICKS + (Math.random() * AVG_GROW_DEVIATION * 2 - AVG_GROW_DEVIATION),
		);
	}

	tick(): void {
		if (this.shouldDelete) return;
		this.ticksUntilNextStage--;
		if (this.ticksUntilNextStage === 0) {
			this.publicState.growthStage++;
		}
	}

	serialize(): SeedType {
		return this.publicState;
	}
}
