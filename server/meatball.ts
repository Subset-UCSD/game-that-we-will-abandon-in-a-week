import { MeatBall as PublicMeatBall  } from "@common/game"

let nextMeatballId = 0

export type MeatballOptions = Omit<PublicMeatBall, 'id'> & {
    xv: number
    yv: number
    // hv = height velocity
    inithv: number
}

export class Meatball {
    publicState: PublicMeatBall 
    xv: number
    yv: number
    hv: number
    shouldDelete = false

    constructor ({
        x = 0,y = 0,height = 0,
        xv = 0,yv = 0,inithv = 10,
    }: Partial<MeatballOptions> = {} ) {
        this.publicState = {
            id: nextMeatballId++,
            x,y,height,
        }

        this.xv=xv
        this.yv=yv
        this.hv = inithv
    }

    tick ():void {
        if (this.shouldDelete) return


        this.publicState.x += this.xv
        this.publicState.y += this.yv
        this.publicState.height += this.hv
        this.hv -= 0.1
        if (this.publicState.height < 0) {
            this.shouldDelete = true
        }
    }

    serialize (): PublicMeatBall {
        return this.publicState
    }
}