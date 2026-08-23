import { SerializedThing } from "@common";
import { RenderableObject } from "./render";
import { Canvas } from "./canvas";

type RegisteredThing = {
  frames: ImageBitmap[]
  timePerFrame?: number
  imageSize: { width: number, height: number }
  scale?: number
  shadowScale?: number
  /** applied BEFORE scale (so basically height of transparent pixels at bottom of original texture) */
  offsetY?: number
}
type Renderable = SerializedThing['type']
const thingsToRender = new Map<Renderable, Promise<RegisteredThing>>([
  ['tree', Promise.all([
    './assets/treee.png',
  ].values().map(url => fetch(url).then((r) => r.blob()).then(createImageBitmap))).then((frames):RegisteredThing => ({
    frames,
    imageSize: {width: 353, height: 312},
    shadowScale: 0.9,
    offsetY: 18,
  }))],
  ['campfire', Promise.all([
    './assets/fire1.png',
    './assets/fire2.png',
  ].values().map(url => fetch(url).then((r) => r.blob()).then(createImageBitmap))).then((frames):RegisteredThing => ({
    frames,
    timePerFrame: 460,
    imageSize: {width: 174, height: 235},
    scale: 0.3,
    offsetY: 50,
    shadowScale: 1.5,
  }))],
  ['techbro', Promise.all([
    './assets/techbro.png',
    './assets/techbro2.png',
  ].values().map(url => fetch(url).then((r) => r.blob()).then(createImageBitmap))).then((frames):RegisteredThing => ({
    frames,
    timePerFrame: 670,
    imageSize: {width: 558, height: 571},
    scale: 0.15,
    offsetY: 100,
  }))],
])
const resolved = new Map(await Promise.all(thingsToRender.entries().map(async ([key,vallue])=>[key,await vallue] as const)))

/**
 * a stateless renderer for objects that don't move
 */
export class BasicRenderer<T extends {id:number;x:number;y:number}>  implements RenderableObject {
  renderType: Renderable
  thing: T
  get index () { return this.thing.y }

  constructor (renderType: Renderable, thing: T) {
    this.renderType = renderType
    this.thing = thing
  }
  
  render ({c}: Canvas) {
    const rendered = resolved.get(this.renderType)
    if (!rendered) return

    const {frames,timePerFrame=1000,imageSize,scale=1,offsetY=0} = rendered
    const frame = frames[Math.floor(Date.now() / (timePerFrame + (this.thing.id * Math.PI) % 50)) % frames.length]
     c.drawImage(frame, this.thing.x - imageSize.width * scale/2, this.index-imageSize.height*scale + offsetY*scale, imageSize.width * scale, imageSize.height*scale);
  }


  renderShadow({c}: Canvas): void {
    const rendered = resolved.get(this.renderType)
    if (!rendered) return

    const {imageSize,scale=1,shadowScale=1} = rendered
    const width = imageSize.width * scale * shadowScale
    c.moveTo(this.thing.x+width/2, this.thing.y)
    c.ellipse(this.thing.x, this.thing.y, width/2, width/10, 0, 0, Math.PI*2)
  }
}

export class ThingRenderer extends BasicRenderer<SerializedThing> {
  constructor (thing: SerializedThing) {
    super(thing.type, thing)
  }
}
