import { GameObject, Vec2 } from "@common";
import { subscribe } from "@server/events";
import { Enemy as NetEnemy, evN, vec2, ev, normalize} from "@common";
import { generateId } from "@server/id-manager";

export type EnemyProps = Omit<NetEnemy, "id"|'type'>;

const MAX_ACCEL = vec2(3);
const MAX_VELOCITY = vec2(10);


function clamp(x:L)

let nextId = 0;
export class Enemy implements GameObject {
    partyId = '';
	shouldDelete: boolean = false;

	publicState: NetEnemy;

	private target = vec2();
	private velocity = vec2()
	private acceleration = vec2();

	constructor(props: EnemyProps) {
		this.publicState = {...props, id: generateId(),type:'enemy'};
	
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
		const moveDirection = normalize(ev`${this.publicState} - ${this.target}`);
		this.acceleration = ev`${this.acceleration} + ${moveDirection}`;
		this.acceleration = {
			x: this.acceleration.x > MAX_ACCEL.x ? MAX_ACCEL.x : this.acceleration.x,
			y: this.acceleration.y > MAX_ACCEL.y ? MAX_ACCEL.y : this.acceleration.y
		};
		this.velocity = this.acceleration

	}

	playerMoved() {

	}

	serialize(): any {
		
	}
}