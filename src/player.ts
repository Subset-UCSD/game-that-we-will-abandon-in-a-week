class Player {
  is_you: boolean;
  x: number = 0;
  y: number = 0;

  constructor(is_you: boolean) {
    this.is_you = is_you;
    const sheepImage = await createImageBitmap(
      await fetch("./assets/sheep.png").then((r) => r.blob()),
    );
  }

  render(c: CanvasRenderingContext2D): void {
    c.drawImage(sheepImage, 0, 0);
  }
}
