import type { InputHandler, Inputs, Keymap } from "@common/input";

export type InputListenerOptions = {
	default: Inputs;
	keymap: Keymap;
	onInput: (inputs: Inputs) => void;
	/**
	 * To make the listener fire at a set frequency in addition to after every
	 * key press/release, set this number (in ms). If undefined or 0 then the
	 * listener will only fire after key events.
	 */
	period?: number;
	addMobileControls?: boolean;
};

export class InputListener {
	private inputs: Inputs;
	private intervalID?: ReturnType<typeof setInterval>;

	private mobileControls: MobileControls | undefined;

	constructor(private readonly options: InputListenerOptions) {
		this.inputs = { ...options.default };
		if (options.addMobileControls) {
			this.mobileControls = new MobileControls(this.options.keymap, this.handleInput);
		}
	}

	private handleInput: InputHandler = (key, value) => {
		if (!key || this.inputs[key] === value) return;

		this.inputs[key] = value;
		this.options.onInput(this.inputs);
	};

	private handleKeydown = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], true);
	private handleKeyup = (e: KeyboardEvent) => this.handleInput(this.options.keymap[e.code], false);

	private handleMousedown = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], true);
	private handleMouseup = (e: MouseEvent) => this.handleInput(this.options.keymap[e.button], false);

	private handleMousemove = (e: MouseEvent) => {
		this.handleInput("mouseX", e.clientX);
		this.handleInput("mouseY", e.clientY);
	};

	/** When the user leaves the page, reset all inputs to default  */
	private handleBlur = () => {
		this.inputs = { ...this.options.default };
		this.options.onInput(this.inputs);
	};

	listen() {
		addEventListener("keydown", this.handleKeydown);
		addEventListener("keyup", this.handleKeyup);
		addEventListener("mousedown", this.handleMousedown);
		addEventListener("mouseup", this.handleMouseup);
		addEventListener("blur", this.handleBlur);
		addEventListener("mousemove", this.handleMousemove);

		if (this.options.period) {
			this.intervalID = setInterval(() => this.options.onInput(this.inputs), this.options.period);
		}

		if (this.mobileControls) {
			this.mobileControls.listen();
		}
	}

	disconnect() {
		removeEventListener("keydown", this.handleKeydown);
		removeEventListener("keyup", this.handleKeyup);
		removeEventListener("mousedown", this.handleMousedown);
		removeEventListener("mouseup", this.handleMouseup);
		removeEventListener("blur", this.handleBlur);
		removeEventListener("mousemove", this.handleMousemove);

		if (this.intervalID !== undefined) {
			window.clearInterval(this.intervalID);
			this.intervalID = undefined;
		}

		if (this.mobileControls) {
			this.mobileControls.disconnect();
		}
	}
}

class MobileControls {
	private touchActive = false;
	private touchControls: HTMLElement | undefined;

	constructor(
		private readonly keymap: Keymap,
		private readonly handleInput: InputHandler,
	) {}

	private handleTouch = (e: PointerEvent) => {
		if (e.pointerType === "touch") {
			this.showTouchControls(true);
		}
	};
	private handleKeydown = (e: KeyboardEvent) => {
		if (this.touchActive) {
			this.showTouchControls(false);
		}
	};

	private showTouchControls(shouldShow: boolean) {
		if (!this.touchControls) return;
		if (shouldShow) {
			this.touchControls.style.display = "";
		} else {
			this.touchControls.style.display = "none";
		}
		this.touchActive = shouldShow;
	}

	listen() {
		this.touchControls = this.makeTouchControls(this.handleInput);
		document.body.append(this.touchControls);
		addEventListener("pointerdown", this.handleTouch);
		addEventListener("keydown", this.handleKeydown);
	}

	disconnect() {
		removeEventListener("pointerdown", this.handleTouch);
		removeEventListener("keydown", this.handleKeydown);
		// there's an event listener cleanup leak here but idrc
		this.touchControls?.remove();
		this.touchActive = false;
	}

	private makeTouchControls(handle: InputHandler): HTMLElement {
		const wrapper = Object.assign(document.createElement("div"), {
			className: "mobile-controls",
		});
		wrapper.style.display = "none";
		//not bug: it is not shuffling the keys and i do know why
		for (const code of Object.keys(this.keymap)) {
			const button = Object.assign(document.createElement("button"), {
				className: "mobile-control",
				textContent: Number.isInteger(+code) ? `MB ${code}` : code,
			});
			let pid: number | undefined;
			button.addEventListener("pointerdown", (e) => {
				handle(this.keymap[code], true);
				button.setPointerCapture((pid = e.pointerId));
			});
			const end = (e: PointerEvent) => {
				if (pid === e.pointerId) {
					handle(this.keymap[code], false);
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
}
