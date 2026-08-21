
/**
 * @example
 * using canvas = new Canvas()
 * document.body.append(canvas.canvas)
 * THis canvas has properties, that youc an acess
 */
export class Canvas {
    canvas = document.createElement('canvas')
    context = ((context: CanvasRenderingContext2D|null) => {

        if (!context) {
            throw new Error('holy fuck')
        }
        return context
    })(this.canvas.getContext('2d'))
    /** alias for `context` */
    get c () { return this.context}
    width = 0
    height = 0

    constructor () {
        this.#observer.observe(this.canvas)
    }

/**
 * clean up everything when the canvas is DISPOSED
 * 🗑️ <- dispose
 * absolutely disposed
 */
    [Symbol.dispose] () {
        this.#observer.disconnect()
        this.canvas.remove()
    }
    
    #resize: ResizeObserverCallback = ([{
        contentBoxSize:[size],
        devicePixelContentBoxSize:[physicalSize]
    }]) => {
        // what the fuck is this
        // this handles high resolution displays (e.g. MacOS retina)
        this.canvas.width = physicalSize.inlineSize
        this.canvas.height = physicalSize.blockSize
        this.width = size.inlineSize
        this.height = size.blockSize
        this.context.scale(
            physicalSize.inlineSize/size.inlineSize,
            physicalSize.blockSize/size.blockSize,
        )
    }
    // This obsers resizing so that the window resizes CLEANLY
    #observer = new ResizeObserver(this.#resize)
}