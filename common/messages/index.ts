import { Inputs } from "@common/input";
import { WholeGameState } from "@common/game-objects";

export interface InputMessage {
	type: "input",
	value: Inputs
}

export interface PingMessage {
	type: "ping"
}

export interface PongMessage {
	type: "pong"
}

// Temporary (don't use)
export interface PlayerPositionMessage {
	type: "position"
	value: {
		x: number;
		y: number;
	}
}

export interface WholeGameStateMessage {
	type: "game-state",
	value: WholeGameState
}

export type ClientMessage = InputMessage | PingMessage | PlayerPositionMessage;

export type ServerMessage = PongMessage | WholeGameStateMessage;

export type Message = ServerMessage | ClientMessage;