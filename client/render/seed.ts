import { RenderableObject } from "./render";
import { Seed } from "@common";
import { Canvas } from "./canvas";

export class ClientSeed implements RenderableObject {
  private seed: Seed;  
  index: number = 0;
  x: number = 0;
  y: number = 0;

  constructor (seed: Seed) {
    this.seed = seed;
  }

  render ({c}: Canvas) {
    
  }
}