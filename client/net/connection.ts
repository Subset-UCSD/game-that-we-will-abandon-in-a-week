import type { Game } from "@client/game";
import { type ClientMessage, serverMessage, type WholeFkingGameState, wholeFkingGameState } from "@common";
import { applyDiffPayload } from "@common/json-optimizer";

/** set by esbuild.ts */
declare const IS_SERVING: boolean;

const SESSION_KEY = "session";

class Connection {
	// WE use ! here because ws is definitelyt defined in this.reconnect but TS is DUMB and thinks it's not
	private ws!: WebSocket;
	private queue: ClientMessage[] = [];
	private game;
	private lastReceivedGameState?: { gameState: WholeFkingGameState; versionId: string };

	private reconnectAttempts = 0;
	constructor(game: Game) {
		this.reconnect();
		this.game = game;
	}

	private handleMessage = (event: MessageEvent) => {
		// who is jason
		let jason;
		try {
			jason = JSON.parse(event.data);
		} catch (error) {
			console.error("Invalid JSON", event.data, error);
			return;
		}
		let result
		try {
			result = serverMessage.safeParse(jason);
		} catch (error) {
			console.error('there appears to be an issue with the schema itself',jason,error)
			return
		}
		if (!result.success) {
			console.error("Schema fucky", jason, result.error);
			return;
		}
		const message = result.data;
		switch (message.type) {
			case "join-response": {
				localStorage.setItem(SESSION_KEY, message.value.sessionId);
				this.game.setCurrPlayerId(message.value.playerId);

				break;
			}
			case "game-state": {
				this.lastReceivedGameState = message.value;
				this.game.updateGameState(message.value.gameState);
				break;
			}
			case "partial-game-state": {
				if (message.value.expectedPreviousVersionId === this.lastReceivedGameState?.versionId) {
					const appliedDiff = applyDiffPayload(
						this.lastReceivedGameState.gameState,
						message.value.gameState,
						message.value.keyState ?? [],
					);
					const result = wholeFkingGameState.safeParse(appliedDiff);
					if (result.success) {
						this.lastReceivedGameState = { gameState: result.data, versionId: message.value.newVersionId };
						this.game.updateGameState(result.data);
						break;
					}
					console.error("applying schema resulted in weird game state", appliedDiff, result.error);
				} else {
					console.error("unexpected prev version id", {
						expected: message.value.expectedPreviousVersionId,
						iHave: this.lastReceivedGameState,
					});
				}
				this.send("please-send-full-game-state", null);
				break;
			}
			case 'tiles': {
				this.game.recieveTRiles(message.value)
				break
			}
			case "particles": {
				for (const particle of message.value) {
					this.game.spawnParticles(particle);
				}
				break;
			}
			case "sound": {
				for (const sound of message.value) {
					this.game.playAudioAtPosition(sound);
				}
				break;
			}
			default: {
				console.log("[server 🗣️]", message);
			}
		}
	};

	private reconnect = async () => {
		if (this.reconnectAttempts > 0) {
			// exponentially BACK OFF connect attempts
			await new Promise((res) => setTimeout(res, 2 ** this.reconnectAttempts * 1000));
			// wait until user sees the tab
			await new Promise(window.requestAnimationFrame);
		}

		const pastSession = localStorage.getItem(SESSION_KEY) ?? undefined;
		const url = window.location.origin.replace(/^http/, "ws");
		this.ws = new WebSocket(IS_SERVING ? "ws://localhost:6769/" : url);

		this.ws.onopen = () => {
			console.log("🤝 connected to server");
			this.reconnectAttempts = 0;
			// join will be the first thing not added to queue
			this.send("join", { sessionId: pastSession });

			for (const msg of this.queue) {
				this.send(msg.type, msg.value);
			}
		};

		this.ws.onmessage = this.handleMessage;
		this.ws.onclose = this.reconnect;

		this.reconnectAttempts++;
	};

	send<T extends ClientMessage["type"], P extends Extract<ClientMessage, { type: T }>["value"]>(type: T, value: P) {
		// Remove when you want to replay events when you have a way to do that
		if (this.ws.readyState !== this.ws.OPEN && type === "input") return;

		const message = {
			type,
			value,
		} as ClientMessage; //:(

		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			this.queue.push(message);
		}
	}
}

export { Connection };
