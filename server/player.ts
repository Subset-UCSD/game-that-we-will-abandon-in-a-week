import { defaultInputs, Inputs } from "@common/input";
import { Player as NetPlayer } from "@common/game";

export class Player implements Serializable {
  private inputs: Inputs;
  private max_speed: number = 2;
  private position: { x: number, y: number } = { x: 0, y: 0 };
  private velocity: { x: number, y: number } = { x: 0, y: 0 };
  private id;
  private static next_id = 0;
 

  constructor() {
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
    return {...this.position, id: this.id};
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
      this.velocity.x = -this.max_speed
    }
    else if (inputs.right) {
      this.velocity.x = this.max_speed
    } else {
      this.velocity.x = 0
    }
  }

  act() {
    if (this.velocity.x != 0)
      this.position.x += this.velocity.x  / Math.hypot(this.velocity.x, this.velocity.y)

    if (this.velocity.y != 0)
      this.position.y += this.velocity.y / Math.hypot(this.velocity.x , this.velocity.y)
  }
}