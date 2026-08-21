import type { Canvas} from './canvas'
import {Inputs} from './input-listener'

class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;
  x_acc: number = 0;
  y_acc: number = 0;


  private max_speed: number = 1;
  private friction: number = 0.1;
  private frames: any[] = [];

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
    document.addEventListener("keydown", this.accelerate);

    this.is_you = is_you;
    this.getAssets();
  }

 

  async getAssets(): Promise<void> {
    const frameUrls = [
     "./assets/sheep.png",
     "./assets/sheep2.png"
    ]
    this.frames = await Promise.all(frameUrls.map(async url =>
     await createImageBitmap(
      await fetch(url).then((r) => r.blob()),
    )
    ))
  }

  render({c,width}: Canvas): void {
    this.movement() 
    console.log(this.x,  this.y, this.x_vel, this.y_vel, this.x_acc, this.y_acc)
    /** in milliseconds */
    const TIME_PER_FRAME = 500
    const frame = this.frames[Math.floor(Date.now() / TIME_PER_FRAME) % this.frames.length]
    const shouldFlipX = this.x_vel < 0
    const SHEEP_WIDTH = 50
    if (frame) {
      if (shouldFlipX) {
        c.save()
        c.scale(-1, 1)
        c.drawImage(frame, -(this.x )- SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);
        c.restore()

      } else {
        c.drawImage(frame, this.x - SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);
      }
    }
  }

  handleInput(inputs: Record<Inputs, boolean>) {
      if (inputs.up) {
        this.x_vel = -1
      }
      else if (inputs.back) {
        this.x_vel = 1
      } else {}
  }

  KeyW: "up",
		KeyA: "left",
		KeyS: "back",
		KeyD: "right",
		Space: "jump",

  movement() {
    if (this.is_you) {
        this.x += this.x_vel
        this.x_vel += this.x_acc 
        this.x_vel -= Math.sign(this.x_vel) * this.friction
        this.x_vel = Math.max(Math.min(this.x_vel, this.max_speed), -this.max_speed)
        

        this.y += this.y_vel
        this.y_vel += this.y_acc
        this.y_vel -= Math.sign(this.y_vel) * this.friction
        this.y_vel = Math.max(Math.min(this.y_vel, this.max_speed), -this.max_speed)
        
        this.x_acc = 0
        this.y_acc = 0
    }
  } 
}

export {Player};