import { Room } from "./rooms/room";

const url = window.location.origin.replace(/^http/, "ws")
export const ws = new WebSocket(url);
let room:Room | null = null;

ws.onopen = () => {
	ws.send(JSON.stringify({type:"ping"}));
}

ws.onmessage = (msg) => {
	// console.log(msg);
    if (msg.type == "players") {
        // update other player's location
        if (room) room.updatePlayers(msg.players);
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