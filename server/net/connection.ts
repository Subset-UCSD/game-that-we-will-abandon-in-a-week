import { WebSocket } from "ws";

export class ConnectionManager {
	private connections: Connection[];
	constructor() {
		this.connections = [];
	}

	newConnection(socket: WebSocket) {
		socket.on("")
	}
	destroyConnection() {

	}
}


export class Connection {
	constructor(private readonly ws: WebSocket) {}

}


