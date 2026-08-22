import { render } from "./render";
import { defaultInputs, keymap } from "@common/input";
import { InputListener} from "./input-listener";
import { SERVER_GAME_TICK } from "@common/index";
import {Connection} from './connection'
import {Game} from './game'
import {Canvas} from './canvas'

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)


const game = new Game();



// Game loop
while (true) {
	// TEMP
	// player.movement()


	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(40, 150, 50, 1)'
	c.fillRect(0, 0, canvas.width, canvas.height)



	game.render(canvas)


	// arena.render(canvas)

	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)
	c.fillText('press W A S D to move', 50, 100)
	c.fillText('press B to ?', canvas.width - 300, canvas.height - 20)

	

	// player.render(canvas)


	// render other players
	// room.render(canvas);

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}