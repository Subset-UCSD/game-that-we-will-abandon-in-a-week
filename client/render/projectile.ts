


// // pew pew
// type Projectile = {
//   x: number;
//   y: number;
//   xVelocity: number;
//   yVelocity: number;
//   remainingFrames: number;
// }

// 		private updateRenderProjectiles(context: CanvasRenderingContext2D): void{
//     context.save();
//     context.fillStyle = "#f5d442"; //yelo

//     for (let index = this.projectiles.length - 1; index >= 0; index--){
//       const projectile = this.projectiles[index];

//       projectile.x += projectile.xVelocity;
//       projectile.y += projectile.yVelocity;
//       projectile.remainingFrames--;

//       if (projectile.remainingFrames <= 0) {
//         this.projectiles.splice(index, 1);
//         continue;
//       }

//       context.beginPath();
//       context.arc(
//         projectile.x,
//         projectile.y,
//         5,
//         0,
//         Math.PI * 2,
//       );
//       context.fill();
//     }

//     context.restore();
//   }