
export const defaultInputs = {
	attack: false,
	use: false,
	back: false,
	up: false,
	jump: false,
	left: false,
	right: false,
} as const;

export type Inputs = keyof typeof defaultInputs;


export type InputListenerOptions<T extends string> = {
	default: Record<T, boolean>;
	keymap: Record<string | number, T>;
	handleInputs: (inputs: Record<T, boolean>) => void;
	/**
	 * To make the listener fire at a set frequency in addition to after every
	 * key press/release, set this number (in ms). If undefined or 0 then the
	 * listener will only fire after key events.
	 */
	period?: number;
};

export class InputListener<T extends string> {
	options: InputListenerOptions<T>;
	#inputs: Record<T, boolean>;
	#intervalID?: ReturnType<typeof setInterval>
	enabled = true;

	constructor(options: InputListenerOptions<T>) {
		this.options = options;
		this.#inputs = { ...options.default };
	}

	handleInput(key: T | null, pressed: boolean): void {
		if (pressed && !this.enabled) {
			return;
		}
		// Don't send anything if inputs don't change (e.g. if keydown is fired
		// multiple times while repeating a key)
		if (!key || this.#inputs[key] === pressed) {
			return;
		}
		this.#inputs[key] = pressed;
		this.options.handleInputs(this.#inputs);
	}

	#handleKeydown = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], true);
	#handleKeyup = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], false);
	#handleMousedown = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], true);
	#handleMouseup = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], false);

	/** When the user leaves the page, unpress all keys  */
	#handleBlur = () => {
		this.#inputs = { ...this.options.default };
		this.options.handleInputs(this.#inputs);
	};

	listen() {
		addEventListener("keydown", this.#handleKeydown);
		addEventListener("keyup", this.#handleKeyup);
		addEventListener("mousedown", this.#handleMousedown);
		addEventListener("mouseup", this.#handleMouseup);
		addEventListener("blur", this.#handleBlur);

		if (this.options.period) {
			this.#intervalID = setInterval(
				() => this.options.handleInputs(this.#inputs), 
			  this.options.period
			);
		}
	}

	disconnect() {
		removeEventListener("keydown", this.#handleKeydown);
		removeEventListener("keyup", this.#handleKeyup);
		removeEventListener("mousedown", this.#handleMousedown);
		removeEventListener("mouseup", this.#handleMouseup);
		removeEventListener("blur", this.#handleBlur);

		if (this.#intervalID !== undefined) {
			window.clearInterval(this.#intervalID);
			this.#intervalID = undefined;
		}
	}
}