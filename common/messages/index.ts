import { Inputs } from "@common/input";
import { WholeFkingGameState } from "@common/game-objects";

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

export interface WholeFkingGameStateMessage {
	type: "game-state",
	value: WholeFkingGameState
}

export type ClientMessage = InputMessage | PingMessage | PlayerPositionMessage;

export type ServerMessage = PongMessage | WholeFkingGameStateMessage;

export type Message = ServerMessage | ClientMessage;