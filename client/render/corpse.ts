import {SerializedCorpse} from '@common/game'
import { Canvas} from './canvas'

import { RenderableObject } from './render'
import {SHEEP_WIDTH} from './player'

const frames = await Promise.all([
        "./assets/what-do-sheep-become-when-they-die1.png",
        "./assets/what-do-sheep-become-when-they-die2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      ))

export class ClientCorpse implements RenderableObject {
    index = 1;
    state?: SerializedCorpse

    get y () { return this.state?.y ?? 0 }

    renderShadow({c}: Canvas): void {
        if (!this.state) return
        const {x,y,}=this.state
        c.moveTo(x + SHEEP_WIDTH * 0.4, y )
        c.ellipse(x, y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI*2)
    }

    render ({c}: Canvas) {
        if (!this.state) return

const frame = frames[Math.floor(Date.now() / (770 + (this.state.id * Math.PI) % 50)) % frames.length]

        const {x,y,}=this.state
        const offset = Math.sin(Date.now() / (900 + (this.state.id * Math.PI) % 100)) * 5
        if (this.state.facingLeft) {
        c.save()
        c.scale(-1, 1)
        c.drawImage(frame, -(x )- SHEEP_WIDTH/2, y-42+offset, SHEEP_WIDTH, 50);
        c.restore()

      } else {
        c.drawImage(frame, x - SHEEP_WIDTH/2, y-42+offset, SHEEP_WIDTH, 50);

      }
    }
}

