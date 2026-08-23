import { Canvas } from "./canvas";
import { loadFrames } from "./frames";

const {base, walking, think, sleep} = await loadFrames({
	base: ["./assets/sheep.png", "./assets/sheep2.png"],
	walking: ["./assets/sheep-walk1.png", "./assets/sheep-walk2.png"],
	think: ["./assets/think1.png", "./assets/think2.png"],
	sleep: ["./assets/sheep-sleep1.png", "./assets/sheep-sleep2.png"]
} as const);

export const SHEEP_WIDTH = 60;


export class Player {
	  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;
  id = 0
  collied = false

  private max_speed: number = 2;
  private friction: number = 0.1;
  private shouldFlipX: boolean = false;
  private thought: string = ''
  private projectiles: Projectile[] = [];
  private sleeping = false
  private healthpercent = 1;

  renderShadow({c}:Canvas) {
        c.moveTo(this.x + SHEEP_WIDTH * 0.4, this.y )
        c.ellipse(this.x, this.y, SHEEP_WIDTH * 0.4, SHEEP_WIDTH * 0.08, 0, 0, Math.PI*2)
  }

  render({c,width}: Canvas): void {
    // this.movement() 
    /** in milliseconds */
    const isMoving = Math.hypot(this.x_vel, this.y_vel) > 0.1
    const TIME_PER_FRAME = (this.sleeping ? 770 : isMoving ? 50 : 500) + (this.id * Math.PI) % 50
    const framesList =this.sleeping ?  sleep : isMoving ? walking: base
    const frame = framesList[Math.floor(Date.now() / TIME_PER_FRAME) % framesList.length]
    // changed to be in handleInput, so we keep old direction if we stop moving
    // const shouldFlipX = this.x_vel < 0


    const TIME_PER_FRAME_THOUGHT = 600
    const frameThought = think[Math.floor(Date.now() / (TIME_PER_FRAME_THOUGHT + (this.id * Math.PI) % 50)) % think.length]

    
    
    const THOUGHT_WIDTH = 60
    const THOUGHT_HEIGHT = 50
      if (this.shouldFlipX) {
        c.save()
        c.scale(-1, 1)
        c.drawImage(frame, -(this.x )- SHEEP_WIDTH/2, this.y-42, SHEEP_WIDTH, 50);
        c.restore()

      } else {
        c.drawImage(frame, this.x - SHEEP_WIDTH/2, this.y-42, SHEEP_WIDTH, 50);

      }

      if (this.healthpercent < 1){
        c.fillStyle = '#ff025f'
        c.fillRect(this.x - 20, this.y-10-42, 40*(this.healthpercent), 5)
        c.strokeStyle = 'black'
        c.strokeRect(this.x - 20.5, this.y-10.8-42, 41, 6)
      }

      if (this.thought) {
        c.drawImage(frameThought, this.x + SHEEP_WIDTH/2, this.y-THOUGHT_HEIGHT-42, THOUGHT_WIDTH, THOUGHT_HEIGHT);
        c.fillStyle='black'
        c.fillText(this.thought, this.x + SHEEP_WIDTH/2 + 20, this.y - 25-42)
      }    
    
    c.strokeStyle = 'green'
    c.rect(this.x - SHEEP_WIDTH/2, this.y-42, SHEEP_WIDTH, 50)
  }