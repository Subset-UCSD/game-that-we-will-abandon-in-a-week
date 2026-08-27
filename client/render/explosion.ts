import { Explosion } from "@common";
import { RenderableObject } from "./render";
import { Canvas } from "./canvas";
import { extend } from "zod/mini";

 const EXPLOSION_ANIM_MAX_AGE = 1000

export class ClientExplosion extends RenderableObject {
  #explosion: Explosion
  #created = Date.now()

  constructor (explosion: Explosion) {
    super(explosion)
    this.#explosion = explosion
  }

  get index( ) { return this.#explosion.y}
  get shouldDie () { return Date.now() - this.#created >= EXPLOSION_ANIM_MAX_AGE }
  get progress () { return Math.min(1, (Date.now() - this.#created) / EXPLOSION_ANIM_MAX_AGE) }

  render ({c}: Canvas) {
    const {x,y,radius} = this.#explosion
    const progress=this.progress
    c.fillStyle = `rgba(255, ${(progress*255)}, ${(progress*255)}, ${1-progress})`
    c.beginPath()
    c.moveTo(x + radius, y)
    c.arc(x, y, radius, 0, 2 * Math.PI)
    c.fill()

  }

}
