import type { Canvas} from './canvas'
import { Inputs } from "@common/input";

class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;
  // x_acc: number = 0;
  // y_acc: number = 0;


  private max_speed: number = 1;
  private friction: number = 0.1;
  private frames: ImageBitmap[] = [];
  private framesWalking: ImageBitmap[] = [];
  private shouldFlipX: boolean = false;

  //NICK DON'T CHANGE THIS TO A FUNCTION 
  // but what if i did anyways....
  // accelerate = (event: KeyboardEvent): void => {
  //   const keyName = event.key;
  //   if (keyName == "a") {
  //       this.x_acc = -1;
  //   }
  //   else if (keyName == "d") {
  //       this.x_acc = 1;
  //   } else {
  //     this.x_acc = 0;
  //   }

  //   if (keyName == "w") {
  //       this.y_acc = -1
  //   } else if (keyName == "s") {
  //       this.y_acc = 1
  //   } else {
  //     this.y_acc = 0;
  //   }
  // }
  
  constructor(is_you: boolean) {
    this.is_you = is_you;
    this.getAssets();
  }

 

  async getAssets(): Promise<void> {
    [this.frames,this.framesWalking] = await Promise.all([
      // standing
      Promise.all([
        "./assets/sheep.png",
        "./assets/sheep2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      )),
      // walking
      Promise.all([
        "./assets/sheep-walk1.png",
        "./assets/sheep-walk2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      )),
    ])
  }

  render({c,width}: Canvas): void {
    this.movement() 
    /** in milliseconds */
    const isMoving = Math.hypot(this.x_vel, this.y_vel) > 0.1
    const TIME_PER_FRAME = isMoving ? 50 : 500
    const framesList =isMoving ? this.framesWalking: this.frames
    const frame = framesList[Math.floor(Date.now() / TIME_PER_FRAME) % framesList.length]
    // changed to be in handleInput, so we keep old direction if we stop moving
    // const shouldFlipX = this.x_vel < 0

    const SHEEP_WIDTH = 50
    if (frame) {
      if (this.shouldFlipX) {
        c.save()
        c.scale(-1, 1)
        c.drawImage(frame, -(this.x )- SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);
        c.restore()

      } else {
        c.drawImage(frame, this.x - SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);
      }
    }
  }

  handleInput(inputs: Inputs) {
    console.log(this.x,  this.y, this.x_vel, this.y_vel)
    if (inputs.up) {
      this.y_vel = -1
    }
    else if (inputs.down) {
      this.y_vel = 1
    } else {
      this.y_vel = 0
    }

    if (inputs.left) {
      this.x_vel = -1
      this.shouldFlipX = true;
    }
    else if (inputs.right) {
      this.x_vel = 1
       this.shouldFlipX = false;
    } else {
      this.x_vel = 0
    }


  }

  movement() {
    if (this.is_you) {
        this.x += this.x_vel * Math.hypot(this.x_vel, this.y_vel)
        // this.x_vel += this.x_acc 
        // this.x_vel -= Math.sign(this.x_vel) * this.friction
        // this.x_vel = Math.max(Math.min(this.x_vel, this.max_speed), -this.max_speed)
        

        this.y += this.y_vel * Math.hypot(this.x_vel, this.y_vel)
        // this.y_vel += this.y_acc
        // this.y_vel -= Math.sign(this.y_vel) * this.friction
        // this.y_vel = Math.max(Math.min(this.y_vel, this.max_speed), -this.max_speed)
        
        // this.x_acc = 0
        // this.y_acc = 0
    }
  } 

  // for other player
  setLocation(x:number, y:number) {
    if (!this.is_you) {
      this.x = x;
      this.y = y;
    }
  }
}

export {Player};