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
