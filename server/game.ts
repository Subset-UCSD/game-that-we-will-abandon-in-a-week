import { ClientMessage } from "@common/messages";
import { SESSION_KEY_NUM_BYTES } from "@common/session";
import { Player } from "@server/player";
import { WebSocket } from "ws";
import { send } from "./net/send";
import { WholeFkingGameState, GameObject } from "@common/game";
import { Meatball } from "./meatball";
import { Explosion } from "@server/explosion";
import { StaticThing } from "./static-thing";

// ALL OF THE GAME LOGIC
export class Game {
  private players: Map<string, Player> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private idForConnection: Map<WebSocket, string> = new Map();
  private joinedSockets: Set<WebSocket> = new Set();
  private gameObjects: GameObject[] = [
    new StaticThing({type:'tree', x: -100, y: -100}),
    new StaticThing({type:'campfire', x: -100, y: -50}),
    new StaticThing({type:'techbro', x: -0, y: -50}),
  ];
  // meatballs: Meatball[] = [];
  // explosions: Explosion[] = [];

  constructor() {}

  public loop() {
    // process all of the inputs
    // tick the game world

    for (const meatball of this.gameObjects) {
      meatball.tick();
    }
    for (const meatball of this.gameObjects) {
      if (!meatball.shouldDelete || !(meatball instanceof Meatball)) continue;
      this.gameObjects.push(
        new Explosion({
          duration: 20,
          radius: 200,
          x: meatball.publicState.x,
          y: meatball.publicState.y,
        }),
      );
      const EXPLOSION_DAMAGE = 20;
      for (const [_, player] of this.players) {
        player.setHp(player.getHp() - EXPLOSION_DAMAGE);
      }
    }
    this.gameObjects = this.gameObjects.filter((mb) => !mb.shouldDelete);
    // this.explosions = this.explosions.filter((ex) => !ex.shouldDelete);

    // Send all of the clients the state of the world

    const gameState = this.getWorldState();
    for (const conn of this.connections.values()) {
      send(conn, "game-state", gameState);
    }
  }

  getWorldState(): WholeFkingGameState {
    return {
      players: this.players
        .values()
        .map((player) => player.serialize())
        .toArray(),
      meatballs: this.gameObjects
        .filter((o) => o instanceof Meatball)
        .map((mb) => mb.serialize()),
      explosions: this.gameObjects
        .filter((o) => o instanceof Explosion)
        .map((ex) => ex.serialize()),
        things: this.gameObjects
        .filter((o) => o instanceof StaticThing)
        .map((ex) => ex.serialize()),
    };
  }

  handleMessage(ws: WebSocket, msg: ClientMessage) {
    // Don't process messages from sockets who have not joined us yet
    if (msg.type !== "join" && !this.joinedSockets.has(ws)) return;

    switch (msg.type) {
      case "join": {
        let { sessionId } = msg.value;
        let player: Player;

        if (sessionId && this.players.has(sessionId)) {
          // Reconnecting player, kill their old socket
          const oldSocket = this.connections.get(sessionId);
          if (oldSocket && oldSocket.readyState === oldSocket.OPEN) {
            oldSocket.close();
            this.joinedSockets.delete(oldSocket);
          }
          // Set new connection data
          this.connections.set(sessionId, ws);
          this.idForConnection.set(ws, sessionId);
          this.joinedSockets.add(ws);
          player = this.players.get(sessionId)!;
          console.log("welcome existing user", sessionId.slice(0, 8));
        } else {
          sessionId = crypto.getRandomValues(new Uint8Array(SESSION_KEY_NUM_BYTES)).toHex();
          this.connections.set(sessionId, ws);
          this.idForConnection.set(ws, sessionId);
          this.joinedSockets.add(ws);
          player = new Player(this);
          player.addMeatball = this.addMeatball.bind(this) // HACK
          this.players.set(sessionId, player);
          this.gameObjects.push(player);
          console.log("welcome new user", sessionId.slice(0, 8));
        }
        player.connected = true;
        send(ws, "join-response", { sessionId, playerId: player.getId() });
        return;
      }
      case "input": {
        const sessionId = this.idForConnection.get(ws);
        if (!sessionId) {
          console.error(
            "WebSocket input event happened but we don't have an id for that socket stored",
            msg,
          );
          return;
        }
        const player = this.players.get(sessionId);
        if (!player) {
          console.error(`No player found for session id ${sessionId}`);
          return;
        }
        player.setInputs(msg.value);
      }
    }
  }

  addMeatball({x, y, angle}: {x: number, y: number, angle: number}) {
    this.gameObjects.push(
      new Meatball({
        x, y,
        xv: Math.cos(angle) * 5,
        yv: (Math.sin(angle) * 5) / 2,
        height: 42-15,
        inithv: 5,
      }),
    );
  }

  handleDisconnect(ws: WebSocket) {
    // bro idk
    const sessionId = this.idForConnection.get(ws);
    if (!sessionId) return;
    const player = this.players.get(sessionId);
    if (!player) return;
    player.connected = false;
  }
}
