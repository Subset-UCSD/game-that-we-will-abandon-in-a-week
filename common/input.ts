
import z from "zod";

export const inputSchema = z.object({
	attack: z.boolean(),
	use: z.boolean(),
	down: z.boolean(),
	up: z.boolean(),
	right: z.boolean(),
	left: z.boolean(),
	interact: z.boolean(),
	baa: z.boolean(),
	paint: z.boolean(),
	knife: z.boolean(),
	seed: z.boolean(),
	teleport: z.boolean()
});

export type Inputs = z.infer<typeof inputSchema>;

export const defaultInputs: Inputs = {
	attack: false,
	use: false,
	down: false,
	up: false,
	interact: false,
	left: false,
	right: false,
	baa: false,
	paint: false,
	knife: false,
	seed: false,
	teleport: false
} as const;

export const keymap = {
	KeyW: "up",
	KeyA: "left",
	KeyS: "down",
	KeyD: "right",
	Space: "interact",
	KeyB: "baa",
	KeyP: "paint",
	KeyK: 'knife',
	KeyF: "seed",
	KeyM: "teleport",
	0: "attack", // Left mouse button
	2: "use", // Right mouse button
} satisfies Record<string | number, keyof Inputs>;
