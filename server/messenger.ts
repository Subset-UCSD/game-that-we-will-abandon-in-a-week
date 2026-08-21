import type { RawData } from "ws";
import type { ClientMessage } from "@common/messages";

export const handle = (raw: RawData) => {
	const message: ClientMessage = JSON.parse(raw.toString());
	switch(message.type) {
		case "input":
		case "ping":
			
	}
}