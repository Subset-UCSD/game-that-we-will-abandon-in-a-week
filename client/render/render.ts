import type { Canvas } from './canvas'
import { SerializedGameObject } from "@common";


interface RenderableObject {
  // Objects with a higher index render over top of objects with a lower index
  index: number;
  render(canvas: Canvas): void;
  renderShadow?(canvas: Canvas): void;
  update(objState: SerializedGameObject): void;
  shouldRemove?(): boolean
}

// class Explosion implements RenderableObject {
//   index: number = 0
//   render(canvas: Canvas): void {
//     throw new Error('Method not implemented.');
//   }
//   renderShadow?(canvas: Canvas): void {
//     throw new Error('Method not implemented.');
//   }
//   update(objState: SerializedGameObject) {
//     if (objState.type !== 'explosion'){
//       // ignore non-explosion objstate
//       return
//     }
//     objState
//   }
// }

// // explosion.ts exports this
// export function createExplosion() {
//   return new Explosion()
// }
// export function parseExplosion(objState: SerializedGameObject, previous: RenderableObject | undefined): RenderableObject | null {
//   const explode = previous ?? new Explosion()
//   explode.update(objState)
//   return null
// }

// somewhere in game or index.ts
// type Parser = (objState: SerializedGameObject, previous: RenderableObject | undefined) => RenderableObject | null

// const creators: Map<string, Creator> = new Map( [
//     ["explosion", createExplosion]
// ])
// const creators: Record<SerializedGameObject['type'], Creator> = {
//   explosion: createExplosion,
// }

// TODO
// Audio initalized Server Side
// Camera Shake handing

// declare const objects:  SerializedGameObject[]
// const cilentState: Map<number, RenderableObject> = new Map()
// // const renderables: RenderableObject[] = []
// for (const object of objects) {
//     // creators.get(object.type)
//   const existing = cilentState.get(object.id)?? creators[object.type]()
//   existing.update(object)
    
// }

// TODO
// FIND EVERYTHING NOT IN SERVER UPDATE
// Call shouldRemove if not there remove

/**
 * I'm the renderer
 * I'm the one who renders
 * This function runs once every ~20ms but it can run as fast
 * as you want it to! It should be fine to call this as often
 * as you want and the gameplay should be unaffected.
 *
 */
export async function render(canvas: Canvas, objects: RenderableObject[]) {
  const c = canvas.c
  const sorted = objects.toSorted((a, b) => a.index - b.index);
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.beginPath()
  for (const object of sorted) {
    object.renderShadow?.(canvas);
  }
  c.fill()
  for (const object of sorted) {
    object.render(canvas);
  }
}

export { RenderableObject };
