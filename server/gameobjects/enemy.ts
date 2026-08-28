import { clamp, ev, evN, type GameObject, type Enemy as NetEnemy, normalize, vec2 } from "@common";
import { subscribe } from "@server/events";
import { generateId } from "@server/id-manager";

export type EnemyProps = Omit<NetEnemy, "id" | "type">;

const MAX_ACCEL = 3;
const MAX_VELOCITY = 10;

let nextId = 0;
export class Enemy implements GameObject {
	partyId = "";
	shouldDelete: boolean = false;

	publicState: NetEnemy;

	private target = vec2();
	private velocity = vec2();
	private acceleration = vec2();

	get id () { return this.publicState.id}

	constructor(props: EnemyProps) {
		this.publicState = { ...props, id: generateId(), type: "enemy" };

		subscribe(
			"players:move",
			(players) => {
				let shortestPlayer;
				let shortestDist = Infinity;
				for (const [i, player] of players.entries()) {
					const dist: number = evN`${player} @ ${this.publicState}`;
					if (dist < shortestDist) {
						shortestDist = dist;
						shortestPlayer = i;
					}
				}
				if (!shortestPlayer) return;
				const selected = players[shortestPlayer];
				this.target = vec2(selected.x, selected.y);
			},
			this,
		);
	}

	tick(): void {
		const moveDirection = normalize(ev`${this.publicState} - ${this.target}`);
		// TEMP: i changed + -> - so the enemy can stay on the screen . idk if it is right
		this.acceleration = ev`${this.acceleration} - ${moveDirection}`;
		this.acceleration = clamp(this.acceleration, MAX_ACCEL);
		this.velocity = clamp(ev`${this.velocity} + ${this.acceleration}`, MAX_VELOCITY);

		this.publicState = { ...this.publicState, ...ev`${this.velocity} + ${this.publicState}` };
	}

	playerMoved() {}

	serialize(): NetEnemy {
		return this.publicState
	}
}
