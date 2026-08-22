import { defaultInputs, Inputs } from "@common/input";
import { Player as NetPlayer } from "@common/game";
import { Meatball } from './meatball'
import { Game } from './game'

export class Player implements Serializable {
  private inputs: Inputs;
  private max_speed: number = 100;
  private position: { x: number, y: number } = { x: 0, y: 0 };
  private velocity: { x_vel: number, y_vel: number } = { x_vel: 0, y_vel: 0 };
  private id;
  private static next_id = 0;
  private game: Game
  private wasBaaing = false
  private thought: string = ''
 

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
    return {...this.position, ...this.velocity, id: this.id, baaing:this.thought};
  }

  handleInput(inputs: Inputs) {
    if (inputs.up) {
      this.velocity.y_vel = -this.max_speed
    }
    else if (inputs.down) {
      this.velocity.y_vel = this.max_speed
    } else {
      this.velocity.y_vel = 0
    }

    if (inputs.left) {
      this.velocity.x_vel = -this.max_speed
    }
    else if (inputs.right) {
      this.velocity.x_vel = this.max_speed
    } else {
      this.velocity.x_vel = 0
    }

    if (inputs.baa) {
      if (!this.wasBaaing) {

        const thoughts = ['baa','hungy','beh']
        this.thought = thoughts[Math.floor(Math.random() * thoughts.length)]


        const angle = Math.random() * 2 * Math.PI
        this.game.meatBalls.push(new Meatball({
          x: this.position.x + (this.velocity.x_vel < 0 ? -1 : 1) * 15,
          y: this.position.y + 15,
          xv: Math.cos(angle)*5,
          yv: Math.sin(angle)*5 / 2,
          inithv:5
        }))
        this.wasBaaing = true
      }
    } else {
      this.thought = ''
      this.wasBaaing = false
    }
  }

  act() {
    if (this.velocity.x_vel != 0)
      this.position.x += this.velocity.x_vel  / Math.hypot(this.velocity.x_vel, this.velocity.y_vel)

    if (this.velocity.y_vel != 0)
      this.position.y += this.velocity.y_vel / Math.hypot(this.velocity.x_vel , this.velocity.y_vel)
  }
}