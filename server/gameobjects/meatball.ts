import type { GameObject, MeatBall as PublicMeatBall } from "@common/game";
import { generateId } from "@server/id-manager";

let nextMeatballId = 0;

export type MeatballOptions = Omit<PublicMeatBall, "id"> & {
	xv: number;
	yv: number;
	// hv = height velocity
	inithv: number;
};

export class Meatball implements GameObject {
	publicState: PublicMeatBall;
	private xv: number;
	private yv: number;
	private hv: number;
	shouldDelete = false;
	private bounces = 0;
	partyId = "";

	constructor({ x = 0, y = 0, height = 0, xv = 0, yv = 0, inithv = 10 }: Partial<MeatballOptions> = {}) {
		this.publicState = {
			id: generateId(),
			x,
			y,
			height,
			type: "meatball",
		};

		this.xv = xv;
		this.yv = yv;
		this.hv = inithv;
	}

	tick(): void {
		if (this.shouldDelete) return;

		this.publicState.x += this.xv;
		this.publicState.y += this.yv;
		this.publicState.height += this.hv;
		this.hv -= 0.5;
		if (this.publicState.height < 0) {
			this.bounces++;
			if (this.bounces > 5) {
				this.shouldDelete = true;
				return;
			}
			this.hv *= -0.6;
			this.publicState.height = 0;
		}
	}

	serialize(): PublicMeatBall {
		return this.publicState;
	}
}
