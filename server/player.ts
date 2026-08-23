import { defaultInputs, Inputs } from "@common/input";
import { Player as NetPlayer,GameObject } from "@common/game";
import { Meatball } from './meatball';
import { Game } from './game';
import { Corpse } from './coarpse'
import { Vec2,  } from "@common";

const MAX_HP = 67;

export class Player implements GameObject {
  private inputs: Inputs;
  private max_speed: number = 100;
  private position: Vec2 = { x: (Math.random()-0.5) * 1000, y: (Math.random()-0.5) * 1000 };
  private velocity: Vec2 = { x: 0, y: 0 };
  private id;
  private static next_id = 0;
  private game: Game
  private wasBaaing = false
  private thought: string = ''
  private hp: number = 67;
  private facingLeft =false
  connected = false;
  lastInputTime = 0;
  shouldDelete = false

 
  constructor(game: Game) {
    this.game = game
    this.inputs = { ...defaultInputs };
    this.id = Player.next_id++;
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
    this.handleInput(this.inputs);
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
      timeSinceLastInput:Date.now()- this.lastInputTime,
      hp: this.hp,
      maxHp: MAX_HP,
    };
  }

  handleInput(inputs: Inputs) {
    if (inputs.up) {
      this.velocity.y = -this.max_speed
    }
    else if (inputs.down) {
      this.velocity.y = this.max_speed
    } else {
      this.velocity.y = 0
    }

    if (inputs.left) {
      this.facingLeft = true
      this.velocity.x = -this.max_speed
    }
    else if (inputs.right) {
      this.facingLeft = false
      this.velocity.x = this.max_speed
    } else {
      this.velocity.x = 0
    }

    if (inputs.baa) {
      if (!this.wasBaaing) {

        const thoughts = ['baa','hungy','beh']
        this.thought = thoughts[Math.floor(Math.random() * thoughts.length)]


        const angle = Math.random() * 2 * Math.PI
        this.game.addGameObject(
          new Meatball({
            x: this.position.x + (this.facingLeft ? -1 : 1) * 15,
            y: this.position.y,
            xv: Math.cos(angle) * 5,
            yv: (Math.sin(angle) * 5) / 2,
            height: 42-15,
            inithv: 5,
          })
        )
        this.wasBaaing = true
      }
    } else {
      this.thought = ''
      this.wasBaaing = false
    }
  }

  tick() {
    if (this.velocity.x != 0)
      this.position.x += this.velocity.x  / Math.hypot(this.velocity.x, this.velocity.y)

    if (this.velocity.y != 0)
      this.position.y += this.velocity.y / Math.hypot(this.velocity.x , this.velocity.y)

    if (this.hp <= 0) {
      this.hp = MAX_HP
      this.game.addGameObject(new Corpse({
        ...this.position,
        facingLeft: this.facingLeft
      }))
      // TODO: respawn
      this.position.x += 300
    }
  }
  setHp(hp: number) {
    this.hp = hp;
  }
  getHp() {
    return this.hp;
  }
}