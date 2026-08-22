import {WholeFkingGameState,MeatBall} from '@common/game'
import { Canvas} from './canvas'

export class ClientMeatball {
    state?: MeatBall

    render ({c}: Canvas) {
        if (!this.state) return
        c.fillStyle = 'rgba(0, 0, 0, 0.1)'
        const {x,y,height}=this.state
        c.beginPath()
        c.ellipse(x, y, 10, 5, 0, 0, Math.PI*2)
        c.fill()
        
    }
}