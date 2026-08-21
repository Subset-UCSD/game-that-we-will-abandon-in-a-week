import type { Canvas } from './canvas'


interface RenderableObject {
  render: ({c,width}: Canvas) => void;
}

/**
 * I'm the renderer
 * I'm the one who renders
 * This function runs once every ~20ms but it can run as fast
 * as you want it to! It should be fine to call this as often
 * as you want and the gameplay should be unaffected.
 *
 */
export async function render(canvas: Canvas, objects: RenderableObject[]) {
  for (const object of objects) {
    object.render(canvas);
  }
}

export {RenderableObject};
