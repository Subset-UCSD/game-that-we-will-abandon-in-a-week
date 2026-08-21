class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;
  x_acc: number = 0;
  y_acc: number = 0;
  sheepImage: any = null;

  constructor(is_you: boolean) {
    this.is_you = is_you;
    this.getAssets();
  }

  async getAssets(): Promise<void> {
    this.sheepImage = await createImageBitmap(
      await fetch("./assets/sheep.png").then((r) => r.blob()),
    );
  }

  render(c: CanvasRenderingContext2D): void {
    this.movement() 
    c.drawImage(this.sheepImage, this.x, this.y);
  }

  movement() {
    if (this.is_you) {
        this.x += this.x_vel
        this.x_vel += this.x_acc

        this.y += this.y_vel
        this.y_vel += this.y_acc
    }
  }
}



export {Player};