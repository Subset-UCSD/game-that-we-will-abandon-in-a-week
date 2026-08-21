

interface InputMessage {
	type: "input",
	value: {

	}
}

export type ClientMessage = InputMessage;

export type ServerMessage = {}

export type Message = ServerMessage | ClientMessage;