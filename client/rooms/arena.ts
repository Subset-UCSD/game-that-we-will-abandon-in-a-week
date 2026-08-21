export class Arena {
    public readonly width: number;
    public readonly  height: number;

    private readonly context: CanvasRenderingContext2D;

    constructor(width: number, height: number, context: CanvasRenderingContext2D) {
        this.context = context;
        this.width = width;
        this.height = height;
    }


}