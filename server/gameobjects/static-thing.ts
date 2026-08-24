import { GameObject, SerializedThing, Vec2 } from "@common";
import { Player } from "./player";

/**
 * for things that don't move ("static") like trees, signs, and tech bros ig
 */
export class StaticThing implements GameObject {
  static #nextId = 0
  #state: SerializedThing
  shouldDelete = false

  constructor (thing: Omit<SerializedThing, 'id'>) {
    this.#state = {
      id: StaticThing.#nextId++,
      ...thing
    }
  }

  tick(): void {
    // static things dont do anything
  }
  
  serialize(): SerializedThing {
    return this.#state
  }
  
  get id(): number {
    return this.#state.id
  }

  get position(): Vec2 {
    return this.#state
  }

  get interactive(): boolean {
    return this.#state.interactive ?? false
  }

  takeDamageIfPossible (damage: number): void {
    if (this.#state.hp !== undefined) {
      this.#state.hp = Math.max(0, this.#state.hp-damage)
    }
  }
}


