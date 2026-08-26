import { WebSocket } from "ws";
import { ClientMessage, PartialFkingGameStateMessage, Particle } from "@common/messages";
import { SESSION_KEY_NUM_BYTES } from "@common/session";
import { Seed, Corpse, Explosion, StaticThing, Meatball, Player, SEED_COOLDOWN } from "@server/gameobjects";
import { send } from "./net/send";
import { subVec, vecLength, WholeFkingGameState, GameObject, vecLengthSquared, vec2 } from "@common";
import { BoxCollider, Collider } from "./collision";
import { generateDiffPayload } from "@common/json-optimizer";
import { ChunkEntryMap, setTile } from "./tile-manager";

declare const IS_SERVING: boolean

// ALL OF THE GAME LOGIC
export class Game {
  private players: Map<string, Player> = new Map();
  private connections: Map<string, { socket: WebSocket, lastSentGameStateVersionId?: string }> = new Map();
  private idForConnection: Map<WebSocket, string> = new Map();
  private joinedSockets: Set<WebSocket> = new Set();
  private gameObjects: GameObject[] = [
    new StaticThing({ type: 'tree', x: -100, y: -100 }),
    new StaticThing({ type: 'campfire', x: -0, y: -100 }),
    new StaticThing({ type: 'techbro', x: -50, y: -120, interactive: true, hp: 10000, maxHp: 10000,
      collider: new BoxCollider(-50, -130, 20, 20)
     }),
  ];
  private colliders: Collider[] = [];
  private lastSentGameState?: { gameState: WholeFkingGameState, versionId: string }
  private tiles: ChunkEntryMap
  private onTileEdit: (tiles: ChunkEntryMap) => void
  private particleQueue: Particle[] = []

  constructor(tiles: ChunkEntryMap, onTileEdit: (tiles: ChunkEntryMap) => void) { 
    this.tiles = tiles
    this.onTileEdit = onTileEdit
  }

  public loop() {
    // process all of the inputs
    // tick the game world

    this.handlePlayerInputs();

    //TEMP
    for (const [id1, player1] of this.players.entries()) {
      for (const [id2, player2] of this.players.entries()) {
        if (id1 == id2) continue;
        const mtv = player1.collider.collide(player2.collider);
        if (mtv.x != 0 || mtv.y != 0) {
          player1.collied = true
          player1.velocity = mtv
          console.log(player1.id, mtv)
          break
        }
         player1.collied = false
      }
    }

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
      for (const entity of this.gameObjects) {
        if (entity instanceof Player) {
          if (vecLength(subVec(entity.getPosition(), meatball.publicState)) < explosion.radius) {
            entity.setHp(entity.getHp() - EXPLOSION_DAMAGE);
          }
          entity.lines = entity.lines.filter(x => 
            vecLength(subVec(x.end, meatball.publicState)) >= explosion.radius ||
            vecLength(subVec(x.start, meatball.publicState)) >= explosion.radius
          );

        } else if (entity instanceof StaticThing) {
          if (vecLength(subVec(entity.position, meatball.publicState)) < explosion.radius) {
            entity.takeDamageIfPossible(EXPLOSION_DAMAGE)
          }
        }
      }
    }
    // should this be in StaticThing.tick? StaticThing doesn't have access to players
    const interactiveThings = this.gameObjects.values().filter(obj => obj instanceof StaticThing).filter(obj => obj.interactive).toArray()
    // const knives = this.players.values()
    // .flatMap(player => {
    //   const vec = player.getKnifeLocation()
    //   return vec ? [{ knife: vec, player }] : []
    // }).toArray()
    for (const player of this.players.values()) {
      const INTERACTION_RANGE = 30
      // we might want the range to change depending on object size
        player.canInteractWith = interactiveThings.values().filter(thing => vecLengthSquared(subVec(thing.position, player.getPosition())) <= INTERACTION_RANGE * INTERACTION_RANGE).map(thing => thing.id).toArray()


        //
        const KNIFE_DAMAGE = 5.5 // as proclaimed by nick
        const knife = player.getKnifeLocation()
        if (knife) {
          for (const entity of this.gameObjects) {
            if (player===entity)continue
        if (entity instanceof Player) {
          if (entity.collider.isInsideMe(knife)) {
            if (!player.knivesInside.has(entity)) {
              player.knivesInside.add(entity)
              entity.setHp(entity.getHp() - KNIFE_DAMAGE);
              this.particleQueue.push({color:[6, .89,.36],count:20,x:knife.x,y:knife.y,})
            }
          } else {
            player.knivesInside.delete(entity)
          }

        } else if (entity instanceof StaticThing) {
          if (entity.collider){
          if (entity.collider?.isInsideMe(knife)) {
            if (!player.knivesInside.has(entity)) {
              player.knivesInside.add(entity)
              entity.takeDamageIfPossible(KNIFE_DAMAGE)
              this.particleQueue.push({color:[6, .89,.36],count:20,x:knife.x,y:knife.y,})
            }
          } else {
            player.knivesInside.delete(entity)
          }}
        }
      }
        }
        // for (const {knife, player: other} of knives) {
        //   if (player === other)continue
        //     if (player.collider.isInsideMe(knife)) {
        //       player.setHp(player.getHp() - KNIFE_DAMAGE);
        //     }
        // }
    }
    this.gameObjects = this.gameObjects.filter((mb) => !mb.shouldDelete);
  }

  broadcastState() {

    // Send all of the clients the state of the world

    const versionId = crypto.randomUUID()
    // some classes return objects then proceed to mutate them, so deep clone them before they get the chance
    const gameState = structuredClone(this.getWorldState());
    let partialGameStateMessage: PartialFkingGameStateMessage['value'] | undefined
    for (const conn of this.connections.values()) {
      if (this.lastSentGameState && conn.lastSentGameStateVersionId === this.lastSentGameState.versionId) {
        if (!partialGameStateMessage) {
          const keyState = ['x', 'y']
          const partial = generateDiffPayload(this.lastSentGameState.gameState, gameState, keyState)
          partialGameStateMessage = {
            expectedPreviousVersionId: this.lastSentGameState.versionId,
            newVersionId: versionId,
            keyState: partial ? keyState : undefined,
            gameState: partial,
          }
        }
        send(conn.socket, "partial-game-state", partialGameStateMessage);
      } else {
        send(conn.socket, "game-state", {
          versionId,
          // sent_because: `prev: conn ${conn.lastSentGameStateVersionId} global ${this.lastSentGameState?.versionId}`,
          gameState
        });
      }
      conn.lastSentGameStateVersionId = versionId

      if (this.particleQueue.length > 0) {
        send(conn.socket,'particles', this.particleQueue)
      }
    }
    this.lastSentGameState = { gameState, versionId }
    if (this.particleQueue.length > 0) {

      this.particleQueue = []
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
      seeds: this.gameObjects.filter(x => x instanceof Seed).map(x => x.serialize()),
      colliders: this.gameObjects.map(object => object.collider?.serialize()).filter(collider => collider !== undefined),
      tiles: Object.fromEntries(this.tiles.entries().map(([key, {tiles}])=>[key, tiles])),
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
          const oldSocket = this.connections.get(sessionId)?.socket;
          if (oldSocket && oldSocket.readyState === oldSocket.OPEN) {
            oldSocket.close();
            this.joinedSockets.delete(oldSocket);
          }
          // Set new connection data
          this.connections.set(sessionId, {socket:ws});
          this.idForConnection.set(ws, sessionId);
          this.joinedSockets.add(ws);
          player = this.players.get(sessionId)!;
          console.log("welcome existing user", sessionId.slice(0, 8));
        } else {
          sessionId = crypto.getRandomValues(new Uint8Array(SESSION_KEY_NUM_BYTES)).toHex();
          this.connections.set(sessionId, {socket:ws});
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
        break
      }
      case 'please-send-full-game-state': {
        const sessionId = this.idForConnection.get(ws);
        if (!sessionId) {
          console.error('who dis', msg)
          break
        }
        const conn = this.connections.get(sessionId)
        if (!conn) {
          console.error('who dis (2)', msg, sessionId)
          break
        }
        conn.lastSentGameStateVersionId = undefined
        break
      }
      case 'tile-edit': {
        if (!IS_SERVING) {
          break
        }
        for (const vec of msg.value.vecs) {
          setTile(this.tiles, vec, msg.value.tile)
        }
        // console.log(this.tiles)
         this.onTileEdit(this.tiles)
        break
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

      const last = player.lines.at(-1)
      if (player.inputs.paint) {
        let wipLine
        const point = {
          // this is the opposite of the meatball spawn position below
          x: player.position.x + (player.facingLeft ? 1 : -1) * 15,
          y: player.position.y,
        }
        if (!last || last.committed) {
          wipLine = {
            start: point, end: point,
          }
          player.lines.push(wipLine)
        } else {
          wipLine = last
        }
        const proposedNewLine = { ...wipLine, end: point }
        const MAX_LEN = 20
        // split new line segment when it would get too long
        if (vecLengthSquared(subVec(proposedNewLine.start, proposedNewLine.end)) > MAX_LEN * MAX_LEN) {
          wipLine.committed = Date.now()
          player.lines.push({ start: wipLine.end, end: point })
        } else {
          wipLine.end = point
        }
      } else if (last && !last.committed) {
        // commit challenge refernece??
        last.committed = Date.now()
      }
      if (player.inputs.baa) {
        if (!player.wasBaaing) {

          const thoughts = ['baa', 'hungy', 'beh']
          player.thought = thoughts[Math.floor(Math.random() * thoughts.length)]

          const angle = Math.random() * 2 * Math.PI
          this.addGameObject(
            new Meatball({
              x: player.position.x + (player.facingLeft ? -1 : 1) * 10,
              y: player.position.y,
              xv: Math.cos(angle) * 5,
              yv: (Math.sin(angle) * 5) / 2,
              height: 42 - 15 - 9,
              inithv: 5,
            })
          )
          player.wasBaaing = true
        }
      } else {
        player.thought = ''
        player.wasBaaing = false
      }
      if (player.inputs.seed && player.seedCooldownTicks <= 0) {
        this.addGameObject(new Seed({
          growthStage: 0,
          x: player.position.x,
          y: player.position.y
        }));
        player.seedCooldownTicks = SEED_COOLDOWN;
      }
      if (player.inputs.interact) {
        if (!player.wasInteracting) {
          const target = player.canInteractWith[0]
          if (target !== undefined) {
            const thing = this.gameObjects.values().filter(o => o instanceof StaticThing).find(o => o.id === target)
            if (thing) {
              this.handlePlayerInteractingWithThing(player, thing)
            }
          }
          player.wasInteracting = true
        }
      } else {
        player.wasInteracting = false
      }
    }
  }

  handlePlayerInteractingWithThing (player: Player, thing: StaticThing): void {
    // TODO: how should we handle dialog? should tech bro extend StaticThing and implement a method with interaction logic?
    // do we want to send a message to the client to render a dialog pop up, or to represent it as state? if latter, do we want to send this to everyone?
  }

  handleDisconnect(ws: WebSocket) {
    // bro idk
    this.joinedSockets.delete(ws)
    const sessionId = this.idForConnection.get(ws);
    this.idForConnection.delete(ws)
    if (!sessionId) return console.log('someone left but we dont know who they are');
    this.connections.delete(sessionId)
    const player = this.players.get(sessionId);
    if (!player) return console.log('someone left but they dont have a player for some reason', sessionId.slice(0, 8));
    player.connected = false;
    console.log("bye", sessionId.slice(0, 8));
  }
}
