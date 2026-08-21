export interface Inputs {
	attack: boolean;
	use: boolean;
	down: boolean;
	up: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	baa: boolean
}

export const defaultInputs: Inputs = {
	attack: false,
	use: false,
	down: false,
	up: false,
	jump: false,
	left: false,
	right: false,
	baa: false,
} as const;

export const keymap = {
	KeyW: "up",
	KeyA: "left",
	KeyS: "down",
	KeyD: "right",
	Space: "jump",
	KeyB: 'baa',
	0: "attack", // Left mouse button
	2: "use", // Right mouse button
} satisfies Record<string | number, keyof Inputs>;
