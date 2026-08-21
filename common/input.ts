export interface Inputs {
	attack: boolean;
	use: boolean;
	down: boolean;
	up: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
}

export const defaultInputs: Inputs = {
	attack: false,
	use: false,
	down: false,
	up: false,
	jump: false,
	left: false,
	right: false,
} as const;
