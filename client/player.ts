import type { Canvas } from './canvas'
import { RenderableObject } from './render'
import { Inputs } from "@common/input";
import { Player as NetPlayer } from "@common/game";

const [frames,framesWalking, framesThought] = await Promise.all([
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
      // thought bubble
      Promise.all([
        "./assets/think1.png",
        "./assets/think2.png"
        ].map(async url =>
          await createImageBitmap(
            await fetch(url).then((r) => r.blob()),
          )
      )),
    ])

// pew pew
type Projectile = {
  x: number;
  y: number;
  xVelocity: number;
  yVelocity: number;
  remainingFrames: number;
}

class Player implements RenderableObject {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;

  private max_speed: number = 2;
  private friction: number = 0.1;
  private shouldFlipX: boolean = false;
  private thought: string = ''
  private projectiles: Projectile[] = [];

  constructor(is_you: boolean) {
    this.is_you = is_you;
  }

 
  fireAt(targetX: number, targetY: number): void {
    const startX = this.x;

    const startY = this.y + 50;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance ===0 ){
      return;
    }

    const projectileSpeed = 0;

    // push projectile object
    this.projectiles.push(
      {
        x: startX,
        y: startY,

        // normalizing by distance so diagonal shots move at same speed as horiz/vert
        xVelocity:deltaX / distance * projectileSpeed,
        yVelocity: deltaY / distance * projectileSpeed,
        remainingFrames: 180,
      }
    )
  }

    // 
  private updateRenderProjectiles(context: CanvasRenderingContext2D): void{
    context.save();
    context.fillStyle = "#f5d442"; //yelo

    for (let index = this.projectiles.length - 1; index >= 0; index--){
      const projectile = this.projectiles[index];

      projectile.x += projectile.xVelocity;
      projectile.y += projectile.yVelocity;
      projectile.remainingFrames--;

      if (projectile.remainingFrames <= 0) {
        this.projectiles.splice(index, 1);
        continue;
      }

      context.beginPath();
      context.arc(
        projectile.x,
        projectile.y,
        5,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    context.restore();
  }

  render({c,width}: Canvas): void {
    // this.movement() 
    /** in milliseconds */
    const isMoving = Math.hypot(this.x_vel, this.y_vel) > 0.1
    const TIME_PER_FRAME = isMoving ? 50 : 500
    const framesList =isMoving ? framesWalking: frames
    const frame = framesList[Math.floor(Date.now() / TIME_PER_FRAME) % framesList.length]
    // changed to be in handleInput, so we keep old direction if we stop moving
    // const shouldFlipX = this.x_vel < 0


    const TIME_PER_FRAME_THOUGHT = 600
    const frameThought = framesThought[Math.floor(Date.now() / TIME_PER_FRAME_THOUGHT) % framesThought.length]

    const SHEEP_WIDTH = 60
    const THOUGHT_WIDTH = 60
    const THOUGHT_HEIGHT = 50
      if (this.shouldFlipX) {
        c.save()
        c.scale(-1, 1)
        c.drawImage(frame, -(this.x )- SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);
        c.restore()

      } else {
        c.drawImage(frame, this.x - SHEEP_WIDTH/2, this.y, SHEEP_WIDTH, 50);

      }
      if (this.thought) {
        c.drawImage(frameThought, this.x + SHEEP_WIDTH/2, this.y-THOUGHT_HEIGHT, THOUGHT_WIDTH, THOUGHT_HEIGHT);
        c.fillText(this.thought, this.x + SHEEP_WIDTH/2 + 20, this.y - 25)
      }    
  }

  handleInput(inputs: Inputs) {
    // if (inputs.up) {
    //   this.y_vel = -this.max_speed
    // }
    // else if (inputs.down) {
    //   this.y_vel = this.max_speed
    // } else {
    //   this.y_vel = 0
    // }

    if (inputs.left) {
      // this.x_vel = -this.max_speed
      this.shouldFlipX = true;
    }
    else if (inputs.right) {
      // this.x_vel = this.max_speed
       this.shouldFlipX = false;
    } else {
      this.x_vel = 0
    }


    if (inputs.baa) {
      if (!this.thought) {
        const thoughts = ['baa','hungy','beh']
        this.thought = thoughts[Math.floor(Math.random() * thoughts.length)]
      }
    } else {
      this.thought = ''
    }
  }

  // movement() {
  //   if (this.is_you) {
  //       if (this.x_vel != 0)
  //         this.x += this.x_vel / Math.hypot(this.x_vel, this.y_vel)

  //       if (this.y_vel != 0)
  //         this.y += this.y_vel / Math.hypot(this.x_vel, this.y_vel)
  //   }
  // } 

  // render projectile prob move this later
  // this.updateRenderProjectiles(c);

  // for other player

  updatePlayerState(playerData: NetPlayer) {
      this.thought = playerData.baaing
      this.setLocation(playerData.x, playerData.y);
      this.x_vel = playerData.x_vel
      this.y_vel = playerData.y_vel

  }


  setLocation(x:number, y:number) {
    // if (!this.is_you) 
      if (x < this.x)
        this.shouldFlipX = true
      else if (x > this.x) {
        this.shouldFlipX = false
      }


      this.x = x;
      this.y = y;
    // }
  }
}

export {Player};