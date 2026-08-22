import { ClientMessage } from "@common/messages";
import { SESSION_KEY_NUM_BYTES } from "@common/session";
import { Player } from "@server/player";
import { randomBytes } from "node:crypto";
import { WebSocket } from "ws";
import { send } from "./net/send";
import {WholeFkingGameState} from '@common/game'
import { Meatball} from './meatball'

// ALL OF THE GAME LOGIC
export class Game {

	private players: Map<string, Player> = new Map();
	private connections: Map<string, WebSocket> = new Map();
	private idForConnection: Map<WebSocket, string> = new Map();
	private joinedSockets: Set<WebSocket> = new Set();
	 meatBalls: Meatball[] = []

	constructor() {

	}

	public loop() {
		// process all of the inputs
		// tick the game world
		for (const player of this.players.values()) {
			player.act()
		}
		for (const meatball of this.meatBalls) {
			meatball.tick()
		}
		for (const meatball of this.meatBalls) {
			meatball.publicState.x
		}
		this.meatBalls = this.meatBalls.filter(mb => !mb.shouldDelete)


		// Send all of the clients the state of the world

		const gameState = this.getWorldState()
		for (const conn of this.connections.values()) {
			send(conn, 'game-state',gameState )
		}
	}


	getWorldState():WholeFkingGameState {
		return {
			players: this.players.values().map(player => player.serialize() ).toArray(),
			meatballs: this.meatBalls.map(mb => mb.serialize())
		}
	}


	handleMessage(ws: WebSocket, msg: ClientMessage) {
		// Don't process messages from sockets who have not joined us yet
		if (msg.type !== "join" && !this.joinedSockets.has(ws)) return;

		switch (msg.type) {
			case "join": {
				let {sessionId} = msg.value;
				let player: Player;

				if (sessionId && this.players.has(sessionId)) {
					// Reconnecting player, kill their old socket
					const oldSocket = this.connections.get(sessionId);
					if (oldSocket && oldSocket.readyState === oldSocket.OPEN) {
						oldSocket.close();
						this.joinedSockets.delete(oldSocket);
					}
					// Set new connection data
					this.connections.set(sessionId, ws);
					this.idForConnection.set(ws, sessionId);
					this.joinedSockets.add(ws);
					player = this.players.get(sessionId)!;
					console.log('welcome existing user', sessionId.slice(0,8))
				} else {
					sessionId = randomBytes(SESSION_KEY_NUM_BYTES).toString("hex");
					this.connections.set(sessionId, ws);
					this.idForConnection.set(ws, sessionId);
					this.joinedSockets.add(ws);
					player = new Player(this);
					this.players.set(sessionId, player);
					console.log('welcome new user', sessionId.slice(0,8))
				}
				player.connected = true
				send(ws, "join-response", {sessionId, playerId: player.getId()});
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
					return
				}
				player.setInputs(msg.value);
			}
				
		}
	}
	handleDisconnect(ws: WebSocket) {
		// bro idk
		const sessionId = this.idForConnection.get(ws);
		if (!sessionId) return
		const player = this.players.get(sessionId);
		if (!player) return
		player.connected = false
	}

};