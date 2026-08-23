import { GameObject, SerializedThing } from "@common";

export class StaticThing implements GameObject {
  static #nextId = 0
  #state: SerializedThing
  shouldDelete = false

  constructor ({type,x,y}: Omit<SerializedThing, 'id'>) {
    this.#state = {
      id: StaticThing.#nextId++,
      type,x,y,
    }
  }

  tick(): void {
    // static things dont do anything
  }
  
  serialize(): SerializedThing {
    return this.#state
  }
}


