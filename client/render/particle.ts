import { Particle, SerializedGameObject } from "@common";
import { RenderableObject } from "./render";
import { Canvas } from "./canvas";

// i think particles will always render on top
// should they be clipped when they go behind ?
export class ClientParticle /*implements RenderableObject*/ {
#color: {h:number,s:number,l:number}
#x: number
#y: number
#xv: number
#yv: number
#yAccel: number
dieTime: number
#radius: number
  constructor ({
    color:[h,s,l],x,y,xvSpread=0,yvBase=0,yvGravity=0,yvSpread=0,
    lifetime,
    radius,
  }: Omit<Particle, 'count'>) {
this.#color={h,s,l}
this.#x=x
this.#y=y
// todo: it looks very rectangular, needs elliptic sampling i think
this.#xv=(xvSpread * (Math.random()* 2 - 1))
this.#yv=yvBase + (yvSpread * (Math.random()* 2 - 1)) 
this.#yAccel=yvGravity
this.dieTime = Date.now() + lifetime
this.#radius = radius
  }

  /**
   * 
   * @param dt delta time in SECONDS!!
   */
  tick (dt: number) {
    // kinematic equations
    /// source: https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-sheet.pdf
    this.#x += this.#xv * dt
    this.#y += this.#yv * dt + this.#yAccel /2 * dt * dt
    this.#yv += this.#yAccel * dt
  }

  get index () { return this.#y }

  render({c}: Canvas): void {
    c.fillStyle = `hsl(${this.#color.h}, ${this.#color.s}%, ${this.#color.l}%)`
    c.beginPath()
    c.moveTo(this.#x + this.#radius, this.#y)
    c.arc(this.#x, this.#y, this.#radius, 0, 2 * Math.PI, )
    c.fill()
  }

  shouldRemove(): boolean {
    return Date.now() >= this.dieTime
  }

  update(objState: SerializedGameObject): void {
    // not relevant
  }
}