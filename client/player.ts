class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;
  x_vel: number = 0;
  y_vel: number = 0;
  x_acc: number = 0;
  y_acc: number = 0;

  private max_speed: number = 1;
  private sheepImage: any = null;


   accelerate = (event: KeyboardEvent): void => {
    const keyName = event.key;
    console.log(keyName, this, this.x, this.x_vel, this.y, this.y_vel)
    if (keyName == "a") {
        this.x_acc = -1;
    }
    else if (keyName == "d") {
        this.x_acc = 1;
    } else {
      this.x_acc = 0;
    }

    if (keyName == "w") {
        this.y_acc = 1
    } else if (keyName == "s") {
        this.y_acc = -1
    } else {
      this.y_acc = 0;
    }
  }
  
  constructor(is_you: boolean) {
    document.addEventListener("keydown", this.accelerate);

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
    if (this.sheepImage != null) c.drawImage(this.sheepImage, this.x, this.y, 50, 50);
  }

  movement() {
    if (this.is_you) {
        this.x += this.x_vel
        this.x_vel += this.x_acc
        this.x_vel = Math.min(Math.abs(this.x_vel), this.max_speed)

        this.y += this.y_vel
        this.y_vel += this.y_acc
        this.y_vel = Math.min(Math.abs(this.y_vel), this.max_speed)
    }
  } 
}

export {Player};