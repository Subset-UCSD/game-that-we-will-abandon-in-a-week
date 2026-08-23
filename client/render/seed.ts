import { RenderableObject } from "./render";
import { Seed } from "@common";

export class ClientSeed implements RenderableObject {
  #seed: Seed
  #created = Date.now()

  constructor (seed: Seed) {
    this.#seed = seed;
  }

  render ({c}: Canvas) {
    const {x,y,growthStage} = this.#seed
    const progress = this.progress
    c.fillStyle = `rgba(255, ${(progress*255)}, ${(progress*255)}, ${1-progress})`
    c.beginPath()
    c.moveTo(x + radius, y)
    c.arc(x, y, radius, 0, 2 * Math.PI)
    c.fill()

  }
}