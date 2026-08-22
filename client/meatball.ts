import {WholeFkingGameState,MeatBall} from '@common/game'
import { Canvas} from './canvas'



const frames = await Promise.all([
        "./assets/meatball1.png",
        "./assets/meatball2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      ))

export class ClientMeatball {
    state?: MeatBall

    render ({c}: Canvas) {
        if (!this.state) return

const frame = frames[Math.floor(Date.now() / (470 + (this.state.id * Math.PI) % 50)) % frames.length]

        const {x,y,height}=this.state
        c.fillStyle = 'rgba(0, 0, 0, 0.2)'
        c.beginPath()
        c.ellipse(x, y+3, 5, 2, 0, 0, Math.PI*2)
        c.fill()

        const R = 7
        c.drawImage(frame, x - R, y - R - height, R*2, R*2)
        // c.fillStyle = '#800'
        // c.beginPath()
        // c.ellipse(x, y-height, 5, 5, 0, 0, Math.PI*2)
        // c.fill()
    }
}