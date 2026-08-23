import { ClientMessage, serverMessage } from "@common";
import { Game } from './game'
/** set by esbuild.ts */
declare const IS_SERVING: boolean

const SESSION_KEY = "session";

const safeToDedope = new Set<ClientMessage['type']>([
	'input'
])
// this is a code smell, 
// TODO: this could be better
function dedopeMessages (queue: ClientMessage[]): ClientMessage[] {
	/*const dedoped = []
	for (const message of queue) {
		if (safeToDedope.has(message.type) &&
		 dedoped.at(-1)?.type === message.type) {
			// overwrite last message with newer one
			dedoped[dedoped.length - 1] = message
		 } else {
			dedoped.push(message)
		 }
	}
	return dedoped*/
	return queue;
}

class Connection {
	private ws!: WebSocket;  /// this ! should make you MAD
	private queue: ClientMessage[] = [];
	private game;


	private reconnectAttempts = 0;
	constructor(game: Game) {
		this.reconnect();
		this.game = game
	}

	private handleMessage = (event: MessageEvent) => {
		let jason
		try {
			jason = JSON.parse(event.data);
		} catch (error) {
			console.error('Invalid JSON', event.data,error, );
			return;
		}
		const result = serverMessage.safeParse(jason)
		if (!result.success) {
			console.error('Schema fucky',jason, result.error, );
			return;
		}
		const message = result.data;
		switch (message.type) {
			case 'join-response': {
				localStorage.setItem(SESSION_KEY, message.value.sessionId);
				this.game.setCurrPlayerId(message.value.playerId)

				break
			}
			case 'game-state': {
				this.game.updateGameState(message.value)
				break
			}
			default: {
				
		console.log('[server 🗣️]', message);
			}
		}
	}

	private  reconnect = async () => {
		if (this.reconnectAttempts > 0) {
			// exponentially BACK OFF connect attempts
			await new Promise(res => setTimeout(res, (2**this.reconnectAttempts) * 1000));
			// wait until user sees the tab
			await new Promise(window.requestAnimationFrame)
		}
			
		const pastSession = localStorage.getItem(SESSION_KEY) ?? undefined;
		const url = window.location.origin.replace(/^http/, "ws");
		this.ws = new WebSocket( IS_SERVING ? 'ws://localhost:6769/': url);

	
		this.ws.onopen = () => {
			console.log("🤝 connected to server")
			this.reconnectAttempts = 0;
			// join will be the first thing not added to queue
			this.send("join", { sessionId: pastSession });
			
			const q =dedopeMessages( this.queue)
			this.queue = []
			for (const msg of q) {
				this.send(msg.type, msg.value);
			}
		}

		this.ws.onmessage = this.handleMessage
		this.ws.onclose = this.reconnect;

		this.reconnectAttempts++;
	}

	send<T extends ClientMessage["type"], P extends Extract<ClientMessage, {type: T}>["value"]>(type: T, value: P) {
		// Remove when you want to replay events when you have a way to do that
		if (this.ws.readyState !== this.ws.OPEN && type === "input") return; 

		const message = {
			type, value
		} as ClientMessage; //:(
		
		if ( this.ws.readyState === WebSocket.OPEN){
			this.ws.send(JSON.stringify(message));
		} else {
			this.queue.push(message)
		}
	}
}

export {Connection}