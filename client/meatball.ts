import {WholeFkingGameState,MeatBall} from '@common/game'
import { Canvas} from './canvas'

export class ClientMeatball {
    state?: MeatBall

    render ({c}: Canvas) {
        if (!this.state) return
        const {x,y,height}=this.state
        c.fillStyle = 'rgba(0, 0, 0, 0.2)'
        c.beginPath()
        c.ellipse(x, y, 5, 2, 0, 0, Math.PI*2)
        c.fill()
        c.fillStyle = '#800'
        c.beginPath()
        c.ellipse(x, y-height, 5, 5, 0, 0, Math.PI*2)
        c.fill()
    }
}