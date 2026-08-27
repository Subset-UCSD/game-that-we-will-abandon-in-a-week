import type { ServerMessage } from "@common/messages";
import type WebSocket from "ws";
export function send<T extends ServerMessage["type"], P extends Extract<ServerMessage, { type: T }>["value"]>(
	ws: WebSocket,
	type: T,
	value: P,
) {
	ws.send(
		JSON.stringify({
			type,
			value,
		}),
	);
}
