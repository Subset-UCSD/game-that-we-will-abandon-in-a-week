import { Inputs } from "@common/input";

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

export type ClientMessage = InputMessage | PingMessage;

export type ServerMessage = PongMessage

export type Message = ServerMessage | ClientMessage;