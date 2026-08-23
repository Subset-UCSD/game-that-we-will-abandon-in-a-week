import { RenderableObject } from "./render";
import { Seed } from "@common";
import { Canvas } from "./canvas";
import { loadFrames } from "./frames";

const frames = await loadFrames([
  "./assets/seed1.png",
  "./assets/seed2.png"
]);

const SIZE = 20;

export class ClientSeed implements RenderableObject {
  private props: Seed;
  get index() { return this.props.y };

  constructor(props: Seed) {
    this.props = props;
  }

  renderShadow({ c }: Canvas): void {
    c.moveTo(this.props.x + 5, this.props.y)
    c.ellipse(this.props.x, this.props.y, SIZE - 4, 4, 0, 0, Math.PI * 2)
  }

  render({ c }: Canvas) {
    const frame = frames[Math.floor(Date.now() / (470 + (this.props.id * Math.PI) % 50)) % frames.length]
    const { x, y } = this.props;
    
    c.drawImage(frame, x - SIZE, y - SIZE * 2, SIZE * 2, SIZE * 2);
  }
}