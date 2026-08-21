class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_force: number = 0;
  y_force: number = 0;
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
        
    }
  }
}

