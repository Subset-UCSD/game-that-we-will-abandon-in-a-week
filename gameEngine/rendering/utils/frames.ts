export type UnloadedFrames = Record<string, string[]> | string[];
export type LoadedFrames = Record<string, ImageBitmap[]> | ImageBitmap[];

export async function loadFrames(frames: Record<string, string[]>): Promise<Record<string, ImageBitmap[]>>;
export async function loadFrames(frames: string[]): Promise<ImageBitmap[]>;
export async function loadFrames(frames: UnloadedFrames): Promise<LoadedFrames> {
	if (Array.isArray(frames)) {
		return Promise.all(frames.map(async (url) => await createImageBitmap(await fetch(url).then((r) => r.blob()))));
	} else {
		const loaded: LoadedFrames = {};
		for (const [name, images] of Object.entries(frames)) {
			loaded[name] = await Promise.all(
				images.map(async (url) => await createImageBitmap(await fetch(url).then((r) => r.blob()))),
			);
		}
		return loaded;
	}
}
