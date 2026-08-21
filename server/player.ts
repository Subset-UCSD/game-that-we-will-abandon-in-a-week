import { defaultInputs, Inputs } from "@common/input";
import { Player as NetPlayer } from "@common/game";

export class Player implements Serializable {
  private inputs: Inputs;
  private position: { x: number, y: number } = { x: 0, y: 0 };
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
}