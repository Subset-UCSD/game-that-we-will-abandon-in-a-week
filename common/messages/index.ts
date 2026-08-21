import { Inputs } from "@common/input";
import {WholeGameState} from "@common"

interface InputMessage {
	type: "input",
	value: Inputs
}

interface PingMessage {
	type: "ping"
}

interface PongMessage {
	type: "pong"
}

// Temporary
interface PlayerPositionMessage {
	type: "position"
	value: {
		x: number;
		y: number;
	}
}

interface WholeGameStateMessage {
	type: "game-state",
	value: WholeGameState
}

export type ClientMessage = InputMessage | PingMessage | PlayerPositionMessage;

export type ServerMessage = PongMessage

export type Message = ServerMessage | ClientMessage;