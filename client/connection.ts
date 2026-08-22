import { ClientMessage, SessionId, serverMessage } from "@common/index";
/** set by esbuild.ts */
declare const IS_SERVING: boolean

const SESSION_KEY = "session";

class Connection {
	private ws!: WebSocket;  /// this ! should make you MAD
	private queue: ClientMessage[] = [];

	private reconnectAttempts = 0;
	constructor() {
		this.reconnect();
	}

	private handleMessage = (event: MessageEvent) => {
		let json
		try {
			json = JSON.parse(event.data);
		} catch (error) {
			console.error('Invalid JSON', event.data,error, );
			return;
		}
		const result = serverMessage.safeParse(json)
		if (!result.success) {
			console.error('Schema fucky',json, result.error, );
			return;
		}
		const message = result.data;
		console.log('[server 🗣️]', message);
		switch (message.type) {
			case 'join-response': {
				localStorage.setItem(SESSION_KEY, message.value);
				break
			}
		}
	}

	private async reconnect() {
		if (this.reconnectAttempts > 0) {
			// exponentially BACK OFF connect attempts
			await new Promise(res => setTimeout(res, (2**this.reconnectAttempts) * 1000));
		}
			
		const pastSession = localStorage.getItem(SESSION_KEY) ?? undefined;
		const url = window.location.origin.replace(/^http/, "ws");
		this.ws = new WebSocket( IS_SERVING ? 'ws://localhost:6769/': url);

	
		this.ws.onopen = () => {
			console.log("open")
			this.reconnectAttempts = 0;
			// join will be the first thing not added to queue
			this.send("join", { sessionId: pastSession });
			
			const q = this.queue
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
		const message = {
			type, value
		} as ClientMessage; //:(
		
		if (this.ws && this.ws.readyState === WebSocket.OPEN){
			this.ws.send(JSON.stringify(message));
		} else {
			this.queue.push(message)
		}
	}
}

export {Connection}