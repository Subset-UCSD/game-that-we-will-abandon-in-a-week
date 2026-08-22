import {WholeFkingGameState,MeatBall} from '@common/game'
import { Canvas} from './canvas'

import { RenderableObject } from './render'


const frames = await Promise.all([
        "./assets/meatball1.png",
        "./assets/meatball2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      ))

export class ClientMeatball implements RenderableObject {
    state?: MeatBall

    get y () { return this.state?.y ?? 0 }

    renderShadow({c}: Canvas): void {
        if (!this.state) return
        const {x,y,height}=this.state
        c.moveTo(x + 5, y)
        c.ellipse(x, y, 5, 2, 0, 0, Math.PI*2)
    }

    render ({c}: Canvas) {
        if (!this.state) return

const frame = frames[Math.floor(Date.now() / (470 + (this.state.id * Math.PI) % 50)) % frames.length]

        const {x,y,height}=this.state
        

        const R = 7
        c.drawImage(frame, x - R, y - R - 3 - height, R*2, R*2)
        // c.fillStyle = '#800'
        // c.beginPath()
        // c.ellipse(x, y-height, 5, 5, 0, 0, Math.PI*2)
        // c.fill()
    }
}