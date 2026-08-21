// meta info like where other players are and where objects are
// duplicate of the type in server
type Player = {
  id: string;
  x: number;
  y: number;
};

class Room {
    players: Player[];

    constructor() {
        this.players = [];
    }

    updatePlayer(players: Player[]) {
        this.players = players;
    }
}
