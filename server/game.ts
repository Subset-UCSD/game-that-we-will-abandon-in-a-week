import { ClientMessage } from "@common/messages";
import { SESSION_KEY_NUM_BYTES } from "@common/session";
import { Player } from "@server/gameobjects/player";
import { WebSocket } from "ws";
import { send } from "./net/send";
import { WholeFkingGameState, GameObject } from "@common/game";
import { Meatball } from "./gameobjects/meatball";
import { Explosion } from "@server/gameobjects/explosion";
import { StaticThing } from "./gameobjects/static-thing";
import { Corpse } from "./gameobjects/corpse";
import { subVec, vecLength } from "@common";
import { Collider } from "./collision";
import { Seed } from "./gameobjects/seed";

// ALL OF THE GAME LOGIC
export class Game {
  private players: Map<string, Player> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private idForConnection: Map<WebSocket, string> = new Map();
  private joinedSockets: Set<WebSocket> = new Set();
  private gameObjects: GameObject[] = [
    new StaticThing({ type: 'tree', x: -100, y: -100 }),
    new StaticThing({ type: 'campfire', x: -0, y: -100 }),
    new StaticThing({ type: 'techbro', x: -50, y: -120 }),
  ];
  private colliders: Collider[] = [];

  constructor() { }

  public loop() {
    // process all of the inputs
    // tick the game world

    for (const collider of this.colliders) {
      for (const otherColider of this.colliders) {
        // if (collider.collide()) {
        //   //
        // }
      }
    }

    this.handlePlayerInputs();

    for (const meatball of this.gameObjects) {
      meatball.tick();
    }
    for (const meatball of this.gameObjects) {
      if (!meatball.shouldDelete || !(meatball instanceof Meatball)) continue;
      const explosion = new Explosion({
        duration: 20,
        radius: 100,
        x: meatball.publicState.x,
        y: meatball.publicState.y,
      })
      this.gameObjects.push(
        explosion
      );
      const EXPLOSION_DAMAGE = 20;
      for (const [_, player] of this.players) {
        if (vecLength(subVec(player.getPosition(), meatball.publicState)) < explosion.radius) {
          player.setHp(player.getHp() - EXPLOSION_DAMAGE);
        }
      }
    }
    this.gameObjects = this.gameObjects.filter((mb) => !mb.shouldDelete);
  }

  broadcastState() {

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
      corpses: this.gameObjects
        .filter((o) => o instanceof Corpse)
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

  addGameObject(gameObject: GameObject): void {
    this.gameObjects.push(gameObject)
  }

  handlePlayerInputs() {
    for (const [_, player] of this.players) {
      if (player.inputs.up) {
        player.velocity.y = -player.max_speed
      } else if (player.inputs.down) {
        player.velocity.y = player.max_speed
      } else {
        player.velocity.y = 0
      }

      if (player.inputs.left) {
        player.facingLeft = true
        player.velocity.x = -player.max_speed
      }
      else if (player.inputs.right) {
        player.facingLeft = false
        player.velocity.x = player.max_speed
      } else {
        player.velocity.x = 0
      }

      if (player.inputs.baa) {
        if (!player.wasBaaing) {

          const thoughts = ['baa', 'hungy', 'beh']
          player.thought = thoughts[Math.floor(Math.random() * thoughts.length)]

          const angle = Math.random() * 2 * Math.PI
          this.addGameObject(
            new Meatball({
              x: player.position.x + (player.facingLeft ? -1 : 1) * 15,
              y: player.position.y,
              xv: Math.cos(angle) * 5,
              yv: (Math.sin(angle) * 5) / 2,
              height: 42 - 15,
              inithv: 5,
            })
          )
          player.wasBaaing = true
        }
      } else {
        player.thought = ''
        player.wasBaaing = false
      }
      if (player.inputs.seed) {
        this.addGameObject(new Seed({
          growthStage: 0,
          x: player.position.x,
          y: player.position.y
        }));
        player.seedCooldownTicks = SEED_COOLDOWN;
      }
    }
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
