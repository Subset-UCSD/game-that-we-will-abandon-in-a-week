import { defaultInputs, keymap } from "@common/input";
import { InputListener} from "./input-listener";
import { SERVER_GAME_TICK } from "@common";
import {Connection} from './net/connection'
import {Game} from './game'
import {Canvas} from './render'
import { DebugTileEditor } from "./debug/tile-editor";

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)


const game = new Game();

declare const IS_SERVING: boolean
if (IS_SERVING) {
	game.__debugTileEditor = new DebugTileEditor()
}

// Game loop
while (true) {
	// TEMP
	// player.movement()


	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(40, 150, 50, 1)'
	c.fillRect(0, 0, canvas.width, canvas.height)



	game.render(canvas)


	// arena.render(canvas)


	// player.render(canvas)


	// render other players
	// room.render(canvas);

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}