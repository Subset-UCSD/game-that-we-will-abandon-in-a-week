import { Camera, Game } from "@client/game"
import { Canvas } from "@client/render"
import { addVec, scaleVec, subVec, Vec2 } from "@common"
import { TILE_SIZE } from "@common/tiles"

export class DebugTileEditor {
  #enabled = false
  #mouse?: Vec2
  #mouseInWorld?: Vec2
  #mouseDown = false
  
  constructor () {
    const button = Object.assign(document.createElement('button'), {
      className: 'debug-tile-editor',
      textContent: 'toggle tile editing'
    })
    document.body.append(button)
    button.addEventListener('click', () => {
      this.#enabled = !this.#enabled
      if (!this.#enabled) {
        this.#mouse = undefined
        this.#mouseDown = false
      }
    })

    document.addEventListener('pointerdown', e => {
      this.#mouseDown = true
    })
    document.addEventListener('pointerup', e => {
      this.#mouseDown = false
    })
    document.addEventListener('pointercancel', e => {
      this.#mouseDown = false
    })
    document.addEventListener('pointermove', e => {
      this.#mouse = { x: e.clientX, y: e.clientY }
    })
  }

  render ({c,width,height}:Canvas, camera: Camera) {
    if (!this.#enabled) {
      return
    }    


    if (this.#mouse) {
      const mouseInWorld = addVec(scaleVec(subVec(this.#mouse, { x: width/2, y: height/2 }), 1 / camera.scale), camera)
      this.#mouseInWorld = {x:Math.floor(mouseInWorld.x / TILE_SIZE),y: Math.floor(mouseInWorld.y / TILE_SIZE)}
      c.fillStyle = 'rgba(255, 255, 255, 0.1)'
      c.fillRect(
        this.#mouseInWorld.x * TILE_SIZE,
        this.#mouseInWorld.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      )
    } else {
      this.#mouseInWorld = undefined
    }

    const left = camera.x - width/camera.scale/2
    const right = camera.x + width/camera.scale/2
    const startX = Math.ceil((left) / TILE_SIZE)
    const endX = Math.floor((right) / TILE_SIZE)

    const top = camera.y - height/camera.scale/2
    const bottom = camera.y + height/camera.scale/2
    const startY = Math.ceil((top) / TILE_SIZE) 
    const endY = Math.floor((bottom) / TILE_SIZE) 
    // console.log(startX,endX,startY,endY)

    c.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    c.beginPath()
    for (let x = startX; x <= endX; x++) {
      c.moveTo(x * TILE_SIZE, top)
      c.lineTo(x * TILE_SIZE, bottom)
    }
    for (let y = startY; y <= endY; y++) {
      c.moveTo(left, y*TILE_SIZE)
      c.lineTo(right, y*TILE_SIZE)
    }
    c.stroke()

  }
}
