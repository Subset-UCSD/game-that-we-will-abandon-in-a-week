import {
	type ChunkMap,
	ev,
	type GameObject,
	normalize,
	scaleVec,
	subVec,
	vec2,
	vecLength,
	vecLengthSquared,
	type WholeFkingGameState,
} from "@common";
import { generateDiffPayload } from "@common/json-optimizer";
import type {
	ClientMessage,
	PartialFkingGameStateMessage,
	Particle,
	ServerMessage,
	SoundEvent,
} from "@common/messages";
import { Explosion, Meatball, Player, SEED_COOLDOWN, Seed, StaticThing } from "@server/gameobjects";
import type { WebSocket } from "ws";
import { collide } from "./collision";
import { CollisionWorld } from "./collisionWorld";
import { emit } from "./events";
import type { Party, Room } from "./gamelogic";
import { D20 } from "./gameobjects/d20";
import { Enemy } from "./gameobjects/enemy";
import { send } from "./net/send";
import { type ChunkEntryMap, setTile } from "./tile-manager";

// import { emit } from "cluster";

declare const IS_SERVING: boolean;

const SESSION_KEY_NUM_BYTES = 32;

//Temp
const d20 = new D20();

// http://localhost:6767/
// ALL OF THE GAME LOGIC
export class Game {
	private players: Map<string, Player> = new Map();
	private parties: Map<string, Party> = new Map();
	private connections: Map<string, { socket: WebSocket; lastSentGameStateVersionId?: string }> = new Map();
	private idForConnection: Map<WebSocket, string> = new Map();
	private joinedSockets: Set<WebSocket> = new Set();
	private collision_world = new CollisionWorld(this);
	private optionStep = 0;
	private optionTimer = 0;
	gameObjects: GameObject[] = [
		d20,
		new StaticThing({ kind: "tree", x: -100, y: -100 }),
		new StaticThing({ kind: "campfire", x: -0, y: -100 }),
		new (class extends StaticThing {
			// static {
			// 	type State = 'first' | 'second'
			// }
			#playerState = new Map<Player, { name: string; happy?: boolean }>();
			*logic(player: Player): Generator<{ message: string; options: string[] }, void, string> {
				const knowledge = this.#playerState.get(player);
				if (knowledge) {
					if (knowledge.happy !== undefined) {
						if (knowledge.happy) {
							yield { message: `hey ${knowledge.name}`, options: ["hi"] };
						} else {
							yield { message: `go away ${knowledge.name}`, options: ["no", "ok"] };
						}
					} else if (player.clouds >= 3) {
						yield { message: "WOW holy shit", options: ["language"] };
						yield { message: "cloud compute.", options: ["sorry?"] };
						player.maxHp *= 2;
						const response1 = yield {
							message: "i dont have much to reward you with so i will double your max hp",
							options: ["thanks", "um wont this make it harder for me to get clouds from myself"],
						};
						if (response1 !== "thanks") {
							knowledge.happy = false;
							yield { message: "ok fuck off u ungrateful shit", options: ["..."] };
						} else {
							knowledge.happy = true;
						}
					} else if (player.clouds > 0) {
						yield {
							message: `hey ${knowledge.name} so you have ${player.clouds} cloud which is not THREE cloud i think i will have to mark this on your performance review are we aligned`,
							options: ["can we circle back"],
						};
					} else {
						yield {
							message: `hi ${knowledge.name} where tf are my clouds i dont wish to speak to u rn sry`,
							options: ["ok fuck you too"],
						};
					}
					return;
				}
				yield {
					message: "yo",
					options: ["sup tech bro"],
				};
				const name = yield {
					message: "what is ur name",
					options: [
						"alice",
						"bob",
						"charlies",
						"daisy",
						// i keep soft locking myself
						// 'I am Benjamin Netanyahu.'
					],
				};
				if (name.includes("Ben")) {
					yield { message: " hey so fuck", options: [] };
				}
				yield { message: `hey ${name} what r ur thoughts on ai`, options: ["i love ai", " i hate ai"] };
				yield { message: " i dont care", options: ["..."] };
				const respone1 = yield { message: "i am a tech bro", options: ["yes", "no"] };
				if (respone1 === "no") {
					yield { message: "?", options: ["sory"] };
				}
				yield { message: "everything must be CLOUD", options: ["so ?"] };
				yield { message: "i want THREE cloud", options: ["ok"] };
				this.#playerState.set(player, { name });
			}
			// ;*#
		})({
			kind: "techbro",
			x: -50,
			y: -120,
			interactive: true,
			hp: 10000,
			maxHp: 10000,
			collider: { type: "box", position: vec2(-50, -150), width: 40, height: 70, rotation: 0, offset: vec2() },
		}),
		new (class extends StaticThing {
			*logic(player: Player): Generator<{ message: string; options: string[] }, void, string> {
				const action = yield { message: "this is the temple of john typescript", options: ["pray", "leave"] };
				if (action === "pray") {
					yield {
						message: `you say: “Switching on a template literal expression does not narrow the interpolated union variable This is the behavior in every version tried (4.1.5, 5.9.2, 7.0.2; not expressible before 4.1), and I (had claude) review the FAQ for entries about type narrowing and template literal types Inside case "apple pie":, foo is still typed "apple" | "pear" | "banana", so const apple: "apple" = foo fails with:  error TS2322: Type '"apple" | "pear" | "banana"' is not assignable to type '"apple"'.  This is wrong because the case can only be reached when foo === "apple". The switch subject \${foo} pie as const is typed as "apple pie" | "pear pie" | "banana pie", and each case label corresponds to exactly one value of foo. The compiler already computes that correspondence, but control flow analysis doesn't propagate the match back to foo. The equivalent if ((\${foo} pie as const) === "apple pie") fails the same way, while switching on foo directly narrows as expected.”`,
						options: ["meditate"],
					};
				}
			}
			// ;*#
		})({
			kind: "altar",
			x: -980,
			y: -1650,
			interactive: true,
		}),
		new Enemy({
			x: -300,
			y: -300,
		}),
	];
	private rooms: Map<string, Room> = new Map([
		["base", { id: "base", x: 0, y: 0 }],
		["test", { id: "test", x: 1900, y: 2200 }],
	]);
	private lastSentGameState?: { gameState: WholeFkingGameState; versionId: string };
	private tiles: ChunkEntryMap;
	private onTileEdit: (tiles: ChunkEntryMap) => void;
	private particleQueue: Particle[] = [];
	private soundQueue: SoundEvent[] = [];
	private collisionWorld = new CollisionWorld(this);

	constructor(tiles: ChunkEntryMap, onTileEdit: (tiles: ChunkEntryMap) => void) {
		this.tiles = tiles;
		this.onTileEdit = onTileEdit;

		console.info(`!!! VIRUS DETECTED !!!`);
		console.info(`You have a virus installed on your system.`);
		console.info(`Please install a trusted file cleaning tool to resolve the issue.`);
		console.info(``);
		console.info(`    npm install -g left-pad`);
		console.info(``);
		// console.info(`---`)
	}

	public loop() {
		// process all of the inputs
		// tick the game world

		this.handlePlayerInputs();

		//TEMP

		// colider :)

		for (const gameObj1 of this.gameObjects) {
			for (const gameObj2 of this.gameObjects) {
				if (gameObj1.id === gameObj2.id) continue;
				if (!gameObj1.collider || !gameObj2.collider) continue;
				const [isColliding, smallestOverlapAmount, mtvAxis] = collide(gameObj1.collider, gameObj2.collider);
				if (isColliding) {
					gameObj1?.hasCollidedWith?.(gameObj2, scaleVec(mtvAxis, smallestOverlapAmount));
					gameObj2?.hasCollidedWith?.(gameObj1, scaleVec(mtvAxis, smallestOverlapAmount));
				}
				//CollisionWorld

				// if (mtv.x != 0 || mtv.y != 0) {
				// 	player1.collied = true;
				// 	player1.velocity = mtv;
				// 	// console.log(player1.id, mtv)
				// 	break;
				// }
				// player1.collied = false;
			}
		}

		for (const meatball of this.gameObjects) {
			meatball.tick();
		}
		// if (!isVecEq(oldPos,this.position)) {
		// }
		emit(
			"players:move",
			this.players
				.values()
				.map(({ id, position: { x, y } }) => ({ id: id + "", x, y }))
				.toArray(),
		);
		for (const meatball of this.gameObjects) {
			if (!meatball.shouldDelete || !(meatball instanceof Meatball)) continue;
			const explosion = new Explosion({
				duration: 20,
				radius: 100,
				x: meatball.publicState.x,
				y: meatball.publicState.y,
			});
			this.gameObjects.push(explosion);
			const EXPLOSION_DAMAGE = 20;
			for (const entity of this.gameObjects) {
				if (entity instanceof Player) {
					const explosionToPlayer = subVec(entity.getPosition(), meatball.publicState);
					const dist = vecLength(explosionToPlayer);
					if (dist < explosion.radius) {
						entity.setHp(entity.getHp() - EXPLOSION_DAMAGE);
						entity.applyImpulse(ev`(${explosionToPlayer} / ${dist}) * ${(explosion.radius - dist) * 1.5}`);
					}
					entity.lines = entity.lines.filter(
						(x) =>
							vecLength(subVec(x.end, meatball.publicState)) >= explosion.radius ||
							vecLength(subVec(x.start, meatball.publicState)) >= explosion.radius,
					);
					// const explosionToPlayer = ev`(${entity.position} - ${explosion.publicState})\`
				} else if (entity instanceof StaticThing) {
					if (vecLength(subVec(entity.position, meatball.publicState)) < explosion.radius) {
						entity.takeDamageIfPossible(EXPLOSION_DAMAGE);
					}
				} else if (entity instanceof Enemy) {
					const explosionToPlayer = subVec(entity.publicState, meatball.publicState);
					const dist = vecLength(explosionToPlayer);
					if (dist < explosion.radius) {
						entity.publicState.healthPoint -= EXPLOSION_DAMAGE;
						if (entity.publicState.healthPoint < 0) entity.publicState.healthPoint = 0;
						// entity.setHp(entity.getHp() - EXPLOSION_DAMAGE);
						entity.applyImpulse(ev`(${explosionToPlayer} / ${dist}) * ${(explosion.radius - dist) * 1.5}`);
					}
				}
			}
		}
		// should this be in StaticThing.tick? StaticThing doesn't have access to players
		const interactiveThings = this.gameObjects
			.values()
			.filter((obj) => obj instanceof StaticThing)
			.filter((obj) => obj.interactive)
			.toArray();
		// const knives = this.players.values()
		// .flatMap(player => {
		//   const vec = player.getKnifeLocation()
		//   return vec ? [{ knife: vec, player }] : []
		// }).toArray()
		for (const player of this.players.values()) {
			const INTERACTION_RANGE = 30;
			// we might want the range to change depending on object size
			player.canInteractWith = interactiveThings
				.values()
				.filter(
					(thing) =>
						vecLengthSquared(subVec(thing.position, player.getPosition())) <= INTERACTION_RANGE * INTERACTION_RANGE,
				)
				.map((thing) => thing.id)
				.toArray();

			// for (const {knife, player: other} of knives) {
			//   if (player === other)continue
			//     if (player.collider.isInsideMe(knife)) {
			//       player.setHp(player.getHp() - KNIFE_DAMAGE);
			//     }
			// }
		}
		this.gameObjects = this.gameObjects.filter((mb) => !mb.shouldDelete);
	}

	broadcastState() {
		// Send all of the clients the state of the world

		let versionId: string = crypto.randomUUID();
		// some classes return objects then proceed to mutate them, so deep clone them before they get the chance
		const gameState = structuredClone(this.getWorldState());
		const keyState = ["x", "y"];
		let partialGameStateMessage: PartialFkingGameStateMessage["value"] | undefined;
		if (this.lastSentGameState) {
			const partial = generateDiffPayload(this.lastSentGameState.gameState, gameState, keyState);
			if (partial !== undefined) {
				partialGameStateMessage = {
					expectedPreviousVersionId: this.lastSentGameState.versionId,
					newVersionId: versionId,
					keyState: partial ? keyState : undefined,
					gameState: partial,
				};
			} else {
				// it's the same game state so dont bump version
				versionId = this.lastSentGameState.versionId;
			}
		}

		for (const conn of this.connections.values()) {
			if (this.lastSentGameState && conn.lastSentGameStateVersionId === this.lastSentGameState.versionId) {
				if (partialGameStateMessage) {
					send(conn.socket, "partial-game-state", partialGameStateMessage);
				}
			} else {
				send(conn.socket, "game-state", {
					versionId,
					// sent_because: `prev: conn ${conn.lastSentGameStateVersionId} global ${this.lastSentGameState?.versionId}`,
					gameState,
				});
			}
			conn.lastSentGameStateVersionId = versionId;

			if (this.particleQueue.length > 0) {
				send(conn.socket, "particles", this.particleQueue);
			}
			if (this.soundQueue.length > 0) {
				send(conn.socket, "sound", this.soundQueue);
			}
		}
		this.lastSentGameState = { gameState, versionId };
		if (this.particleQueue.length > 0) {
			this.particleQueue = [];
		}
		if (this.soundQueue.length > 0) {
			this.soundQueue = [];
		}
	}

	broadcast<T extends ServerMessage["type"], P extends Extract<ServerMessage, { type: T }>["value"]>(
		type: T,
		value: P,
	) {
		for (const conn of this.connections.values()) {
			// type unhappy :(
			// send(conn.socket,type,value)
			conn.socket.send(JSON.stringify({ type, value }));
		}
	}

	getWorldState(): WholeFkingGameState {
		return {
			gameObjects: this.gameObjects.map((mb) => mb.serialize()),
			// d20: [this.d20.serialize()],
			debugColliders: this.gameObjects.map((object) => object.collider).filter((collider) => collider !== undefined),
			// tiles: Object.fromEntries(this.tiles.entries().map(([key, { tiles }]) => [key, tiles])),
		};
	}

	private buildChunkMap(): ChunkMap {
		return Object.fromEntries(this.tiles.entries().map(([key, { tiles }]) => [key, tiles]));
	}

	handleMessage(ws: WebSocket, msg: ClientMessage) {
		// Don't process messages from sockets who have not joined us yet
		if (msg.type !== "join" && !this.joinedSockets.has(ws)) return;

		switch (msg.type) {
			case "join": {
				let { sessionId } = msg.value;
				let player: Player;

				if (sessionId && this.players.has(sessionId)) {
					// Reconnecting player, kill their old socket
					const oldSocket = this.connections.get(sessionId)?.socket;
					if (oldSocket && oldSocket.readyState === oldSocket.OPEN) {
						oldSocket.close();
						this.joinedSockets.delete(oldSocket);
					}
					// Set new connection data
					this.connections.set(sessionId, { socket: ws });
					this.idForConnection.set(ws, sessionId);
					this.joinedSockets.add(ws);
					player = this.players.get(sessionId)!;
					console.log("welcome existing user", sessionId.slice(0, 8));
				} else {
					sessionId = crypto.getRandomValues(new Uint8Array(SESSION_KEY_NUM_BYTES)).toHex();
					this.connections.set(sessionId, { socket: ws });
					this.idForConnection.set(ws, sessionId);
					this.joinedSockets.add(ws);
					player = new Player(this);
					this.players.set(sessionId, player);
					this.gameObjects.push(player);
					console.log("welcome new user", sessionId.slice(0, 8));
				}
				player.connected = true;
				send(ws, "join-response", { sessionId, playerId: player.id });
				send(ws, "tiles", this.buildChunkMap());
				return;
			}
			case "input": {
				const sessionId = this.idForConnection.get(ws);
				if (!sessionId) {
					console.error("WebSocket input event happened but we don't have an id for that socket stored", msg);
					return;
				}
				const player = this.players.get(sessionId);
				if (!player) {
					console.error(`No player found for session id ${sessionId}`);
					return;
				}
				player.setInputs(msg.value);
				break;
			}
			case "please-send-full-game-state": {
				const sessionId = this.idForConnection.get(ws);
				if (!sessionId) {
					console.error("who dis", msg);
					break;
				}
				const conn = this.connections.get(sessionId);
				if (!conn) {
					console.error("who dis (2)", msg, sessionId);
					break;
				}
				conn.lastSentGameStateVersionId = undefined;
				break;
			}
			case "tile-edit": {
				if (!IS_SERVING) {
					break;
				}
				for (const vec of msg.value.vecs) {
					setTile(this.tiles, vec, msg.value.tile);
				}
				// console.log(this.tiles)
				this.onTileEdit(this.tiles);
				this.broadcast("tiles", this.buildChunkMap());
				break;
			}
		}
	}

	addGameObject(gameObject: GameObject): void {
		this.gameObjects.push(gameObject);
	}

	handlePlayerInputs() {
		for (const [_, player] of this.players) {
			const movementDir = vec2();
			if (player.inputs.left) {
				player.facingLeft = true;
			}
			if (player.inputs.right) {
				player.facingLeft = false;
			}
			if (!player.dialogue) {
				if (player.inputs.up) {
					movementDir.y = -1;
				}
				if (player.inputs.down) {
					movementDir.y = 1;
				}

				if (player.inputs.left) {
					movementDir.x = -1;
				}
				if (player.inputs.right) {
					movementDir.x = 1;
				}
			}
			if (vecLengthSquared(movementDir) > 0) {
				// im so scared of touching this but i think acceleration and friction need to be equal ?
				player.acceleration = ev`${normalize(movementDir)} * ${10}`;
			} else {
				player.acceleration = vec2();
			}

			const last = player.lines.at(-1);
			if (player.inputs.paint) {
				let wipLine;
				const point = {
					// this is the opposite of the meatball spawn position below
					x: player.position.x + (player.facingLeft ? 1 : -1) * 15,
					y: player.position.y,
				};
				if (!last || last.committed) {
					wipLine = {
						start: point,
						end: point,
					};
					player.lines.push(wipLine);
				} else {
					wipLine = last;
				}
				const proposedNewLine = { ...wipLine, end: point };
				const MAX_LEN = 20;
				// split new line segment when it would get too long
				if (vecLengthSquared(subVec(proposedNewLine.start, proposedNewLine.end)) > MAX_LEN * MAX_LEN) {
					wipLine.committed = Date.now();
					player.lines.push({ start: wipLine.end, end: point });
				} else {
					wipLine.end = point;
				}
			} else if (last && !last.committed) {
				// commit challenge refernece??
				last.committed = Date.now();
			}
			if (player.inputs.baa) {
				if (!player.wasBaaing) {
					const thoughts = ["baa", "hungy", "beh"];
					player.thought = thoughts[Math.floor(Math.random() * thoughts.length)];

					const angle = Math.random() * 2 * Math.PI;
					const opts = {
						x: player.position.x + (player.facingLeft ? -1 : 1) * 10,
						y: player.position.y,
						xv: Math.cos(angle) * 5,
						yv: (Math.sin(angle) * 5) / 2,
						height: 42 - 15 - 9,
						inithv: 5,
					};
					const meatball = new Meatball(opts);
					this.addGameObject(meatball);
					this.soundQueue.push({
						name: "baaa",
						x: opts.x,
						y: opts.y,
						detectableDistance: 200,
						playbackRate: 1 + Math.random() * 0.2,
					});
					player.wasBaaing = true;
				}
			} else {
				player.thought = "";
				player.wasBaaing = false;
			}
			if (player.inputs.teleport) {
				if (player.wasTeleporting) continue;

				const destination = player.roomId === "base" ? this.rooms.get("test") : this.rooms.get("base");

				if (!destination) return;

				player.roomId = destination.id;
				player.setPosition(destination.x, destination.y);

				player.wasTeleporting = true;
			} else {
				player.wasTeleporting = false;
			}
			if (player.inputs.seed && player.seedCooldownTicks <= 0) {
				this.addGameObject(
					new Seed({
						growthStage: 0,
						x: player.position.x,
						y: player.position.y,
					}),
				);
				player.seedCooldownTicks = SEED_COOLDOWN;
			}
			if (player.inputs.interact) {
				if (!player.wasInteracting) {
					const target = player.canInteractWith[0];
					if (target !== undefined) {
						const thing = this.gameObjects
							.values()
							.filter((o) => o instanceof StaticThing)
							.find((o) => o.id === target);
						if (thing) {
							this.handlePlayerInteractingWithThing(player, thing);
						}
					}
					player.wasInteracting = true;
				}
			} else {
				player.wasInteracting = false;
			}

			if (player.velocity.x !== 0 || player.velocity.y !== 0) {
				if (Date.now() >= player.nextFootsoundCanBePlayedAt) {
					this.soundQueue.push({
						name: "footstep",
						...player.position,
						volume: 0.2,
						playbackRate: 1 + Math.random() * 0.2,
					});
					player.nextFootsoundCanBePlayedAt = Date.now() + 300; ///+ Math.random() * 200
				}
			}
		}
	}

	handlePlayerInteractingWithThing(player: Player, thing: StaticThing): void {
		// TODO: how should we handle dialog? should tech bro extend StaticThing and implement a method with interaction logic?
		// do we want to send a message to the client to render a dialog pop up, or to represent it as state? if latter, do we want to send this to everyone?
		if (player.dialogue) {
			if (player.dialogue.resopondTo === thing && player.dialogue.options.length > 0) {
				thing.interact(player, player.dialogue.options[player.optionIndex % player.dialogue.options.length]);
			}
		} else {
			thing.interact(player, null);
		}
	}

	handleDisconnect(ws: WebSocket) {
		// bro idk
		this.joinedSockets.delete(ws);
		const sessionId = this.idForConnection.get(ws);
		this.idForConnection.delete(ws);
		if (!sessionId) return console.log("someone left but we dont know who they are");
		this.connections.delete(sessionId);
		const player = this.players.get(sessionId);
		if (!player) return console.log("someone left but they dont have a player for some reason", sessionId.slice(0, 8));
		player.connected = false;
		console.log("bye", sessionId.slice(0, 8));
	}
}
