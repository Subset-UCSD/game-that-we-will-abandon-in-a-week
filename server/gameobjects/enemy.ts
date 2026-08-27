import { GameObject, Vec2 } from "@common";
import { subscribe } from "@server/events";
import { Enemy as NetEnemy, evN, vec2 } from "@common";

export type EnemyProps = Omit<NetEnemy, "id">;

let nextId = 0;
export class Enemy implements GameObject {
	shouldDelete: boolean = false;

	publicState: NetEnemy;

	private target = vec2();
	private velocity = vec2()
	private acceleration = vec2();

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
			this.target = vec2(selected.x, selected.y);
		}, this);
	}

	tick(): void {
		this.publicState.x = 
	}

	playerMoved() {

	}

	serialize(): any {
		
	}
}