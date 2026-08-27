import { type Inputs, keymap } from "@common/input";

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
	private intervalID?: ReturnType<typeof setInterval>;

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
		if (e.code === "F3") e.preventDefault();
		this.handleInput(this.options.keymap[e.code], true);
		if (this.touchACtive) {
			this.touchControls.remove();
			this.touchACtive = false;
			addEventListener("pointerdown", this.handleFirstTouch);
		}
	};
	private handleKeyup = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], false);
	private handleMousedown = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], true);
	private handleMouseup = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], false);

	/** When the user leaves the page, unpress all keys  */
	private handleBlur = () => {
		this.inputs = { ...this.options.default };
		this.options.handleInputs(this.inputs);
	};

	private touchACtive = false;
	private touchControls = makeTouchControls((code, down) => this.handleInput(this.options.keymap[code], down));

	private handleFirstTouch = (e: PointerEvent) => {
		if (e.pointerType === "touch") {
			this.touchACtive = true;
			document.body.append(this.touchControls);

			removeEventListener("pointerdown", this.handleFirstTouch);
		}
	};

	listen() {
		addEventListener("keydown", this.handleKeydown);
		addEventListener("keyup", this.handleKeyup);
		addEventListener("mousedown", this.handleMousedown);
		addEventListener("mouseup", this.handleMouseup);
		addEventListener("blur", this.handleBlur);
		addEventListener("pointerdown", this.handleFirstTouch);

		if (this.options.period) {
			this.intervalID = setInterval(() => this.options.handleInputs(this.inputs), this.options.period);
		}
	}

	disconnect() {
		removeEventListener("keydown", this.handleKeydown);
		removeEventListener("keyup", this.handleKeyup);
		removeEventListener("mousedown", this.handleMousedown);
		removeEventListener("mouseup", this.handleMouseup);
		removeEventListener("blur", this.handleBlur);
		removeEventListener("pointerdown", this.handleFirstTouch);
		this.touchControls.remove();
		this.touchACtive = false;
		// this.touchControls = undefined

		if (this.intervalID !== undefined) {
			window.clearInterval(this.intervalID);
			this.intervalID = undefined;
		}
	}
}

function makeTouchControls(handle: (code: string, down: boolean) => void): HTMLElement {
	const wrapper = Object.assign(document.createElement("div"), {
		className: "mobile-controls",
	});
	//bug: it is shuffling the keys and idk why
	for (const code of shuffle(Object.keys(keymap))) {
		const button = Object.assign(document.createElement("button"), {
			className: "mobile-control",
			textContent: Number.isInteger(+code) ? `MB ${code}` : code,
		});
		let pid: number | undefined;
		button.addEventListener("pointerdown", (e) => {
			handle(code, true);
			button.setPointerCapture((pid = e.pointerId));
		});
		const end = (e: PointerEvent) => {
			if (pid === e.pointerId) {
				handle(code, false);
				pid = undefined;
			}
		};
		button.addEventListener("pointerup", end);
		button.addEventListener("pointercancel", end);
		button.addEventListener("contextmenu", (e) => e.preventDefault());
		wrapper.append(button);
	}
	return wrapper;
}

function shuffle(arr: string[]): string[] {
	for (let i = arr.length; i > 0; i--) {
		const index = Math.floor(Math.random() * i);
		if (index !== i - 1) {
			[arr[i - 1], arr[index]] = [arr[index], arr[i - 1]];
		}
	}
	return arr;
}
