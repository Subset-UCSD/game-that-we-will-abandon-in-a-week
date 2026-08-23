// import type { Canvas } from './render'
// import { RenderableObject } from './render/render'
// import { Inputs } from "@common/input";
// import { Player as NetPlayer } from "@common/game";
// import { loadFrames } from './render';

// class Player {
//   is_you: boolean;
//   x: number = 0;
//   y: number = 0;
//   x_vel: number = 0;
//   y_vel: number = 0;
// id = 0
//   collied = false

//   private max_speed: number = 2;
//   private friction: number = 0.1;
//   private shouldFlipX: boolean = false;
//   private thought: string = ''
//   private projectiles: Projectile[] = [];
//   private sleeping = false
//   private healthpercent = 1

//   constructor(is_you: boolean) {
//     this.is_you = is_you;
//   }

 
//   fireAt(targetX: number, targetY: number): void {
//     const startX = this.x;

//     const startY = this.y + 50;

//     const deltaX = targetX - startX;
//     const deltaY = targetY - startY;
//     const distance = Math.hypot(deltaX, deltaY);

//     if (distance ===0 ){
//       return;
//     }

//     const projectileSpeed = 0;

//     // push projectile object
//     this.projectiles.push(
//       {
//         x: startX,
//         y: startY,

//         // normalizing by distance so diagonal shots move at same speed as horiz/vert
//         xVelocity:deltaX / distance * projectileSpeed,
//         yVelocity: deltaY / distance * projectileSpeed,
//         remainingFrames: 180,
//       }
//     )
//   }
//   handleInput(inputs: Inputs) {
//     if (inputs.left) {
//       // this.x_vel = -this.max_speed
//       this.shouldFlipX = true;
//     }
//     else if (inputs.right) {
//       // this.x_vel = this.max_speed
//        this.shouldFlipX = false;
//     } else {
//       this.x_vel = 0
//     }

//     if (inputs.baa) {
//       if (!this.thought) {
//         const thoughts = ['baa','hungy','beh']
//         this.thought = thoughts[Math.floor(Math.random() * thoughts.length)]
//       }
//     } else {
//       this.thought = ''
//     }
//   }
//   updatePlayerState(playerData: NetPlayer) {
//       this.thought = playerData.connected ? playerData.baaing : 'ded'
//       this.setLocation(playerData.x, playerData.y);
//       this.shouldFlipX = playerData.facingLeft
//       this.x_vel = playerData.x_vel
//       this.y_vel = playerData.y_vel

//       this.sleeping = !playerData.connected || playerData.timeSinceLastInput > 10_000
//       this.healthpercent = playerData.hp / playerData.maxHp
//       this.id = playerData.id

//       this.collied = playerData.collied
//   }
//   setLocation(x:number, y:number) {
//       this.x = x;
//       this.y = y;
//   }

//   isAsleep (): boolean {
//     return this.sleeping
//   }
// }

// export {Player};