import { WebSocket } from "ws";

export class ConnectionManager {
	private connections: Connection[];
	constructor() {
		this.connections = [];
	}

	newConnection(socket: WebSocket) {
		
	}
	destroyConnection() {
		
	}
}


export class Connection {
	constructor(private readonly ws: WebSocket) {}

}


