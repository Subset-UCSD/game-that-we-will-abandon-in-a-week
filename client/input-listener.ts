import { Inputs } from "@common/input";

export type InputListenerOptions = {
	default: Inputs;
	keymap: Record<string | number, keyof Inputs>;
	handleInputs: (inputs: Inputs) => void;
	/**
	 * To make the listener fire at a set frequency in addition to after every
	 * key press/release, set this number (in ms). If undefined or 0 then the
	 * listener will only fire after key events.
	 */
	period?: number;
};

export class InputListener {
	public options: InputListenerOptions;
	public enabled = true;

	private inputs: Inputs;
	private intervalID?: ReturnType<typeof setInterval>

	constructor(options: InputListenerOptions) {
		this.options = options;
		this.inputs = { ...options.default };
	}

	handleInput(key: keyof Inputs | null, pressed: boolean): void {
		if (pressed && !this.enabled) return;
		// Don't send anything if inputs don't change (e.g. if keydown is fired
		// multiple times while repeating a key)
		if (!key || this.inputs[key] === pressed) return;
		this.inputs[key] = pressed;
		this.options.handleInputs(this.inputs);
	}

	private handleKeydown = (e: KeyboardEvent) => {
		if (e.code === 'F3') e.preventDefault();
		this.handleInput(this.options.keymap[e.code], true);
	};
	private handleKeyup = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], false);
	private handleMousedown = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], true);
	private handleMouseup = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], false);

	/** When the user leaves the page, unpress all keys  */
	private handleBlur = () => {
		this.inputs = { ...this.options.default };
		this.options.handleInputs(this.inputs);
	};

	listen() {
		addEventListener("keydown", this.handleKeydown);
		addEventListener("keyup", this.handleKeyup);
		addEventListener("mousedown", this.handleMousedown);
		addEventListener("mouseup", this.handleMouseup);
		addEventListener("blur", this.handleBlur);

		if (this.options.period) {
			this.intervalID = setInterval(
				() => this.options.handleInputs(this.inputs), 
			  this.options.period
			);
		}
	}

	disconnect() {
		removeEventListener("keydown", this.handleKeydown);
		removeEventListener("keyup", this.handleKeyup);
		removeEventListener("mousedown", this.handleMousedown);
		removeEventListener("mouseup", this.handleMouseup);
		removeEventListener("blur", this.handleBlur);

		if (this.intervalID !== undefined) {
			window.clearInterval(this.intervalID);
			this.intervalID = undefined;
		}
	}
}