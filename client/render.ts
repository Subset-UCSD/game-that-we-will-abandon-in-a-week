import type { Canvas } from './canvas'


interface RenderableObject {
  y: number
  render: (canvas: Canvas) => void;
  renderShadow?: (canvas: Canvas) => void
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
  const c = canvas.c
  const sorted = objects.toSorted((a, b) => a.y -b.y)
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

export {RenderableObject};
