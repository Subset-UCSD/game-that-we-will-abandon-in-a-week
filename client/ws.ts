import { WholeFkingGameState } from "@common/game";
import { Room } from "./rooms/room";
import { WholeFkingGameStateMessage } from "@common/messages";

const url = window.location.origin.replace(/^http/, "ws")
export const ws = new WebSocket(url);
let room:Room | null = null;

ws.onopen = () => {
	ws.send(JSON.stringify({type:"ping"}));
}

ws.onmessage = (msg) => {
	// console.log(msg);
    if (msg.type == "game-state") {
        const gamestateMsg: WholeFkingGameStateMessage = JSON.parse(msg.data);
        const gamestate: WholeFkingGameState = gamestateMsg.value;
        // update other player's location
        if (room) room.updatePlayers(gamestate.players);
    } else if (msg.type == "connect") {
        // get player id here
    }
}

export const msg = (message: any) => {
    if (ws.readyState!==ws.OPEN) return;
    ws.send(JSON.stringify(message));
}

export const setRoom = (r:Room) => {
    room = r;
}