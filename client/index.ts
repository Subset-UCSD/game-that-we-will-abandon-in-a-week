import { DebugTileEditor } from "./debug/tile-editor";
import { Game } from "./game";

// using canvas = new Canvas();
// const c = canvas.context;
// document.body.append(canvas.glCanvas);
// document.body.append(canvas.canvas);

const game = new Game();

declare const IS_SERVING: boolean;
if (IS_SERVING) {
	game.__debugTileEditor = new DebugTileEditor();
}

// Game loop
while (true) {
	// TEMP
	// player.movement()

	// TEMP: just for demo purposes, please ignore

	game.render();

	// arena.render(canvas)

	// player.render(canvas)

	// render other players
	// room.render(canvas);

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame);
}
