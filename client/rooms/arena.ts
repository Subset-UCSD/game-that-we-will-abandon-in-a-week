export class Arena {
    public readonly width: number;
    public readonly  height: number;

    private readonly context: CanvasRenderingContext2D;

    constructor(width: number, height: number, context: CanvasRenderingContext2D) {
        this.context = context;
        this.width = width;
        this.height = height;
    }

    render(): void {
        this.context.save();

        this.context.fillStyle = "#466b3a";
        this.context.fillRect(0, 0, this.width, this.height);

        this.context.restore();
    }
}