/**
 * The `Canvas` wrapper class handles three things:
 * - Obtains a canvas and its context
 * - Resizes the canvas when you resize the window
 * - Keeps the canvas crisp even on high resolution displays
 *   (e.g. phone screens, Mac retina display)
 *
 *
 * @example
 * using canvas = new Canvas()
 * document.body.append(canvas.canvas)
 * THis canvas has properties, that youc an acess
 */
export class Canvas {
	canvas = document.createElement("canvas");
	context = ((context: CanvasRenderingContext2D | null) => {
		if (!context) {
			throw new Error("holy fuck");
		}
		return context;
	})(this.canvas.getContext("2d", {  }));
	/** alias for `context` */
	get c() {
		return this.context;
	}

	glCanvas = document.createElement('canvas')
	gl = ((context: WebGL2RenderingContext | null) => {
		if (!context) {
			throw new Error("holy fuck (webgl eddition)");
		}
		return context;
	})(this.glCanvas.getContext("webgl2"));


	/** width of canvas, in CSS pixels */
	width = 0;
	/** height of canvas, in CSS pixels */
	height = 0;
	/** device pixel ratio */
	dpr = 1;

	constructor() {
		this.#observer.observe(this.canvas);

		this.gl.enable(this.gl.CULL_FACE);
this.gl.enable(this.gl.DEPTH_TEST);
	}

	/**
	 * clean up everything when the canvas is DISPOSED
	 * 🗑️ <- dispose
	 * absolutely disposed
	 */
	[Symbol.dispose]() {
		this.#observer.disconnect();
		this.canvas.remove();
		this.glCanvas.remove();
	}

	#resize: ResizeObserverCallback = ([
		{
			contentBoxSize: [size],
			devicePixelContentBoxSize: [physicalSize],
		},
	]) => {
		// what the fuck is this
		// this handles high resolution displays (e.g. MacOS retina)
		this.canvas.width = physicalSize.inlineSize;
		this.canvas.height = physicalSize.blockSize;
		this.glCanvas.width = physicalSize.inlineSize;
		this.glCanvas.height = physicalSize.blockSize;
		this.width = size.inlineSize;
		this.height = size.blockSize;
		this.dpr = physicalSize.inlineSize / size.inlineSize;
		this.context.scale(physicalSize.inlineSize / size.inlineSize, physicalSize.blockSize / size.blockSize);
		this.gl.viewport(0, 0, physicalSize.inlineSize, physicalSize.blockSize);
	};
	// This obsers resizing so that the window resizes CLEANLY
	#observer = new ResizeObserver(this.#resize);


	/**
	 * By default, WebGL won't throw an error if you do something wrong. Instead,
	 * you have to manually ask WebGL if there have been any errors.
	 *
	 * If you think something is wrong, you can call this method after every WebGL
	 * call, and this will throw an error if something has gone wrong.
	 *
	 * Even then, the errors that WebGL gives aren't very specific or helpful.
	 * You'll get better quality error messages in the console when it happens.
	 * `checkError` is only good for halting the entire game when an error arises,
	 * which is helpful for debugging.
	 *
	 * However, this has a significant performance impact because it requires
	 * waiting on the GPU to finish drawing. You will have to trade off
	 * performance with knowing what line of code caused an issue. I recommend
	 * removing `checkError` calls after you're done debugging.
	 *
	 * [Source]
	 *
	 * [source]:
	 * https://github.com/Subset-UCSD/cave-game/blob/main/client/render/Gl.ts#L224
	 */
	checkError() {
		const error = this.gl.getError();
		// Error messages from MDN:
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
		switch (error) {
			case this.gl.NO_ERROR:
				return;
			case this.gl.INVALID_ENUM:
				throw new TypeError("INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.");
			case this.gl.INVALID_VALUE:
				throw new RangeError("INVALID_VALUE: A numeric argument is out of range.");
			case this.gl.INVALID_OPERATION:
				throw new TypeError("INVALID_OPERATION: The specified command is not allowed for the current state.");
			case this.gl.INVALID_FRAMEBUFFER_OPERATION:
				throw new Error(
					"INVALID_FRAMEBUFFER_OPERATION: The currently bound framebuffer is not framebuffer complete when trying to render to or to read from it.",
				);
			case this.gl.OUT_OF_MEMORY:
				throw new RangeError("OUT_OF_MEMORY: Not enough memory is left to execute the command.");
			case this.gl.CONTEXT_LOST_WEBGL:
				throw new Error("CONTEXT_LOST_WEBGL: The WebGL context is lost.");
		}
	}
}
