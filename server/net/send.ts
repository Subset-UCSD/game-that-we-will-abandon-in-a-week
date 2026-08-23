import type { ServerMassage } from "@common/messages";
import WebSocket from "ws";
export function send<T extends ServerMassage["type"], P extends Extract<ServerMassage, {type: T}>["value"]>(ws: WebSocket, type: T, value: P) {
	ws.send(JSON.stringify({
		type, value
	}));
}