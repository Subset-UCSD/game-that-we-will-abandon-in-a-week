import { clamp, ev, evN, type GameObject, type Enemy as NetEnemy, normalize, Vec2, vec2 } from "@common";
import { BoxCollider, Collider } from "@server/collision";
import { subscribe, unsubscribe } from "@server/events";
import { generateId } from "@server/id-manager";

export type EnemyProps = Omit<NetEnemy, "id" | "type"|`health${string}`>;

const MAX_ACCEL = 3;
const MAX_VELOCITY = 10;
const MAXIMUIM_HEALTH_OITNS=50
	type vvoid = void

let nextId = 0;
export class Enemy implements GameObject {
	partyId = "";
	shouldDelete: boolean = false;
	collider = new BoxCollider({width:30,height:30,position:vec2(),})
	// dear god please make this not bad
	healhPoints = 50
	maximumHealthPoints = 50

	publicState: NetEnemy;

	private target = vec2();
	private velocity = vec2();
	private acceleration = vec2();

	get id() {
		return this.publicState.id;
	}

	constructor(props: EnemyProps) {
		this.publicState = { ...props, id: generateId(), type: "enemy",healthPMax:MAXIMUIM_HEALTH_OITNS,healthPoint:MAXIMUIM_HEALTH_OITNS };

		const yee=	(players: {
    id: string;
    x: number;
    y: number;
}[]) => {
				// console.log('pm',players)
				let shortestPlayer;
				let shortestDist = Infinity;
				for (const [i, player] of players.entries()) {
					const dist: number = evN`${player} @ ${this.publicState}`;
					if (dist < shortestDist) {
						shortestDist = dist;
						shortestPlayer = i;
					}
				}
				// console.log('pm',this.target)
				if (shortestPlayer===undefined) return;
				const selected = players[shortestPlayer];
				this.target = vec2(selected.x, selected.y);
			}
		this.key=subscribe(
			"players:move",
		yee);
		// this.youch  = () =>
	}
	// p;prvia 
	// rpri 
	private key :string

	tick(): void {
		this.healhPoints  = this.publicState.healthPoint
		if (this.healhPoints<=0) {
			this.acceleration = vec2()
			this.velocity = ev`${this.velocity} * 0.8`
		}else{
		const moveDirection = normalize(ev`${this.publicState} - ${this.target}`);
		// TEMP: i changed + -> - so the enemy can stay on the screen . idk if it is right
		this.acceleration = ev`${this.acceleration} - ${moveDirection}`;
		this.acceleration = clamp(this.acceleration, MAX_ACCEL);
		this.velocity = clamp(ev`${this.velocity} + ${this.acceleration}`, MAX_VELOCITY);
}
		this.publicState = { ...this.publicState, ...ev`${this.velocity} + ${this.publicState}` };

		// this.collider.center = this.publicState
		this.collider.updateLocation(this.publicState)

		if (this.healhPoints <= 0&&this.key) {
			//#region fix this nick
			// TODO FIXME @nick-ls
//  unsubscribe(
// 	// 'players:move',
// 	this.key)
 this.key=''
		}
	}

	applyImpulse (boink: Vec2):vvoid {
this.velocity=ev`${this.velocity}+${boink}`
	}

	// so why did you write this if you ende dup just inlining the evengt lsidhebrterner listener
	playerMoved() {}

	serialize(): NetEnemy {
		return this.publicState;
	}
}
