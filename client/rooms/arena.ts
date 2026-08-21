// logic for rendering "rooms", or segments of the map
import type { Canvas } from '../canvas'

export class Arena {
    public readonly width: number;
    public readonly  height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    render({context, width}: Canvas): void {
        context.save();

        context.fillStyle = "#466b3a";
        context.fillRect(0, 0, this.width, this.height);

        context.restore();
    }
}