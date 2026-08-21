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
const arena = new Arena(1200, 720, c);
const objects = [arena];


// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(255, 0, 0, 0.01)'
	c.fillRect(0, 0, canvas.width, canvas.height)

	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)
	c.fillText('press A D S W to move', 50, 100)

	player.render(canvas)
	

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}