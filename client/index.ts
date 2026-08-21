import { render } from "./render";
import { Player } from "./player";
import { ws } from "./ws";
import { Canvas} from './canvas'

void ws;

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)


//temp

const player = new Player(true)

// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(255, 0, 0, 0.01)'
	c.fillRect(0, 0, canvas.width, canvas.height)


	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)

	player.render(c)
	

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}