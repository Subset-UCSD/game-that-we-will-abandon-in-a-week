import { Gl } from "./gl";

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
	})(this.canvas.getContext("2d", {}));
	/** alias for `context` */
	get c() {
		return this.context;
	}

	glCanvas = document.createElement("canvas");
	gl = new Gl(
		((context: WebGL2RenderingContext | null) => {
			if (!context) {
				throw new Error("holy fuck (webgl eddition)");
			}
			return context;
		})(this.glCanvas.getContext("webgl2")),
	);

	/** width of canvas, in CSS pixels */
	width = 0;
	/** height of canvas, in CSS pixels */
	height = 0;
	/** device pixel ratio */
	dpr = 1;

	constructor() {
		this.#observer.observe(this.canvas);

		// turn off back facing culling since we're viewing the underside of triangles
		// this.gl.gl.enable(this.gl.gl.CULL_FACE);
		// this.gl.gl.enable(this.gl.gl.DEPTH_TEST);
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
		this.gl.gl.viewport(0, 0, physicalSize.inlineSize, physicalSize.blockSize);
	};
	// This obsers resizing so that the window resizes CLEANLY
	#observer = new ResizeObserver(this.#resize);
}
