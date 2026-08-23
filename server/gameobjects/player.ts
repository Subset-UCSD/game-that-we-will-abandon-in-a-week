import { defaultInputs, Inputs } from "@common/input";
import { Player as NetPlayer,GameObject } from "@common/game";
import { Game } from '@server/game';
import { Vec2 } from "@common";
import { Corpse } from './corpse'
import { Meatball } from './meatball';
import { BoxCollider } from "@server/collision";

const MAX_HP = 67;
const LINE_START_AGE = 5_000
const LINE_MAX_AGE = 10_000

export class Player implements GameObject {
  inputs: Inputs;
  max_speed: number = 5;
  position: Vec2 = { x: (Math.random()-0.5) * 1000, y: (Math.random()-0.5) * 1000 };
  velocity: Vec2 = { x: 0, y: 0 };
  id;
  static next_id = 0;
  game: Game
  wasBaaing = false
  thought: string = ''
  hp: number = 67;
  facingLeft =false
  connected = false;
  lastInputTime = 0;
  lines: {start:Vec2, end:Vec2,committed?:number}[] = []
  shouldDelete = false
  seedCooldownTicks = 0;
  collider: BoxCollider;
  collied: boolean = false;
 
  constructor(game: Game) {
    this.game = game
    this.inputs = { ...defaultInputs };
    this.id = Player.next_id++;
    this.collider = new BoxCollider(
      this.position.x,
      this.position.y-20,
      30,
      50,
      0
    )
  }

  setPosition(x: number, y: number) {
    this.position = { x, y };
  }
  getPosition() {
    return this.position;
  }

  setInputs(newInputs: Inputs) {
    // @ts-expect-error
    if (Object.entries(this.inputs).some(([key,value])=>newInputs[key]!==value)){

      this.lastInputTime = Date.now()
    }
    this.inputs = { ...newInputs };
    // this.handleInput(this.inputs);
  }
  getInputs() {
    return this.inputs;
  }

  getId() {
    return this.id;
  }

  serialize(): NetPlayer {
    return {...this.position, x_vel: this.velocity.x, y_vel: this.velocity.y, id: this.id, baaing:this.thought,
      facingLeft:this.facingLeft,
      connected: this.connected,
      // round down to nearest second because client doesnt need that much granularity
      timeSinceLastInput:Math.floor((Date.now()- this.lastInputTime) / 1000) * 1000,
      healthpercent: this.hp,
      maxHp: MAX_HP,
      lines: this.lines.map(({start,end,committed}) => ({start,end,age:committed?Math.min(1, Math.max(0, (Date.now() - (committed + LINE_START_AGE)) / LINE_MAX_AGE)) : null})),
      collied: this.collied,
      thought: this.thought
    };
  }

  setInput(inputs: Inputs) {
    this.inputs = inputs;
  }

  tick() {
    if (this.velocity.x != 0)
      this.position.x += (this.velocity.x  / Math.hypot(this.velocity.x, this.velocity.y)) * this.max_speed

    if (this.velocity.y != 0)
      this.position.y += (this.velocity.y / Math.hypot(this.velocity.x , this.velocity.y)) * this.max_speed

    if (this.hp <= 0) {
      this.hp = MAX_HP
      this.game.addGameObject(new Corpse({
        ...this.position,
        facingLeft: this.facingLeft
      }))
      // TODO: respawn
      this.position.x += 300;
    }
    this.seedCooldownTicks = Math.max(this.seedCooldownTicks - 1, 0);
    this.collider.updateLocation(this.position)
  }
  setHp(hp: number) {
    this.hp = hp;
  }
  getHp() {
    return this.hp;
  }
}
