
export class Canvas {
    canvas = document.createElement('canvas')
    context = ((context: CanvasRenderingContext2D|null) => {

        if (!context) {
            throw new Error('holy fuck')
        }
        return context
    })(this.canvas.getContext('2d'))
    width = 0
    height = 0

    constructor () {
        this.#observer.observe(this.canvas)
    }

    [Symbol.dispose] () {
        this.#observer.disconnect()
        this.canvas.remove()
    }
    
    #resize:ResizeObserverCallback = ([{
        contentBoxSize:[size],
        devicePixelContentBoxSize:[physicalSize]
    }]) => {
        this.canvas.width = physicalSize.inlineSize
        this.canvas.height = physicalSize.blockSize
        this.width = size.inlineSize
        this.height = size.blockSize
        this.context.scale(
            physicalSize.inlineSize/size.inlineSize,
            physicalSize.blockSize/size.blockSize,
        )
    }
    #observer = new ResizeObserver(this.#resize)
}