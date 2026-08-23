import { ClientMassage, serverMassage } from "@common";
import { Game } from './game'
/** set by esbuild.ts */
declare const IS_SERVING: boolean

const SESSION_KEY = "session";

const safeToDedope = new Set<ClientMassage['type']>([
	'input'
])
// this is a code smell, 
// TODO: this could be better
function dedopeMassages (queue: ClientMassage[]): ClientMassage[] {
	/*const dedoped = []
	for (const massage of queue) {
		if (safeToDedope.has(massage.type) &&
		 dedoped.at(-1)?.type === massage.type) {
			// overwrite last massage with newer one
			dedoped[dedoped.length - 1] = massage
		 } else {
			dedoped.push(massage)
		 }
	}
	return dedoped*/
	return queue;
}

class Connection {
	private ws!: WebSocket;  /// this ! should make you MAD
	private queue: ClientMassage[] = [];
	private game;


	private reconnectAttempts = 0;
	constructor(game: Game) {
		this.reconnect();
		this.game = game
	}

	private handleMassage = (event: MessageEvent) => {
		let jason
		try {
			jason = JSON.parse(event.data);
		} catch (error) {
			console.error('Invalid JSON', event.data,error, );
			return;
		}
		const result = serverMassage.safeParse(jason)
		if (!result.success) {
			console.error('Schema fucky',jason, result.error, );
			return;
		}
		const massage = result.data;
		switch (massage.type) {
			case 'join-response': {
				localStorage.setItem(SESSION_KEY, massage.value.sessionId);
				this.game.setCurrPlayerId(massage.value.playerId)

				break
			}
			case 'game-state': {
				this.game.updateGameState(massage.value)
				break
			}
			default: {
				
		console.log('[server 🗣️]', massage);
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
			
			const q =dedopeMassages( this.queue)
			this.queue = []
			for (const msg of q) {
				this.send(msg.type, msg.value);
			}
		}

		this.ws.onmessage = this.handleMassage
		this.ws.onclose = this.reconnect;

		this.reconnectAttempts++;
	}

	send<T extends ClientMassage["type"], P extends Extract<ClientMassage, {type: T}>["value"]>(type: T, value: P) {
		// Remove when you want to replay events when you have a way to do that
		if (this.ws.readyState !== this.ws.OPEN && type === "input") return; 

		const massage = {
			type, value
		} as ClientMassage; //:(
		
		if ( this.ws.readyState === WebSocket.OPEN){
			this.ws.send(JSON.stringify(massage));
		} else {
			this.queue.push(massage)
		}
	}
}

export {Connection}