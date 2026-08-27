import { GameObject, Vec2 } from "@common";
import { subscribe } from "@server/events";
import { Enemy as NetEnemy, evN } from "@common";

export type EnemyProps = Omit<NetEnemy, "id">;

let nextId = 0;
export class Enemy implements GameObject {
	shouldDelete: boolean = false;

	publicState: NetEnemy;

	private target: Vec2 = {
		x: 0,
		y: 0
	};

	constructor(props: EnemyProps) {
		this.publicState = {...props, id: nextId++};
	
		subscribe("players:move", (players) => {
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
			this.target = {
				x: selected.x,
				y: selected.y
			}
		}, this);
	}

	tick(): void {
		
	}

	playerMoved() {

	}

	serialize(): any {
		
	}
}