import { D20Schema, GameObject } from "@common/game";
import { CircleCollider, Collider } from "@server/collision";
import { Vec2, vec2 } from "@common";


const ROTATION_SPEED = 100

export class D20 implements GameObject {
    publicState: D20Schema;
    collider: Collider;
    shouldDelete: boolean = false;

    
    #moving = false;
    constructor (){
        this.publicState = {
            x: 0,
            y: 0, 
            x_vel: 0, 
            y_vel: 0, 
            radius: 30, 
            value: -1,
        }
        this.collider = new CircleCollider(0, 0, 30)
        this.collider.onCollide(this.onCollide)
    }

    onCollide(mts: Vec2) {
        this.publicState.x_vel = mts.x
        this.publicState.y_vel = mts.y
        this.#moving = true
    }
    
    tick() {
        if (this.#moving) {
            this.publicState.x_vel *=  0.9
            this.publicState.y_vel *=  0.9

            this.publicState.x += this.publicState.x_vel
            this.publicState.y += this.publicState.y_vel

            if (this.publicState.x_vel  ** 2 + this.publicState.x_vel ** 2 < 0.1)  {
                this.#moving = false
                this.publicState.x_vel *=  0
                this.publicState.y_vel *=  0
            }
        }

        this.collider.updateLocation(vec2(this.publicState.x, this.publicState.y))
    }
    
    serialize(): D20Schema {
        return this.publicState; 
    }
  }




  
//   export interface GameObject {
//     shouldDelete: boolean;
//     collider?: Collider
//     tick(): void;
//     serialize(): unknown;
//   }
  
  