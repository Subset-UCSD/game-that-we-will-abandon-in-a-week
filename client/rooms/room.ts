// meta info like where other players are and where objects are
// duplicate of the type in server
import { Canvas } from "@client/canvas";
import { Player } from "../player";
import { RenderableObject } from '../render';

type Server_Player = {
  id: string;
  x: number;
  y: number;
};

class Room implements RenderableObject {
    players = new Map<string, Player>();

    constructor() {
        // add current player into the map, don't know the current player's id tho 
    }

    updatePlayers(server_players: Server_Player[]) {
        for (const server_player of server_players) {
            if (!this.players.has(server_player.id)) {
                this.players.set(server_player.id, new Player(false));
            } else {
                const player = this.players.get(server_player.id);
                if (!player) continue;
                player.setLocation(server_player.x, server_player.y);
            }
        }
        
    }

    render(canvas: Canvas) {
        for (const [key, player] of this.players) {
            player.render(canvas);
        }
    }
}


export {Room};