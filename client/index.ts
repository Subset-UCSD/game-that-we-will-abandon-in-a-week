import { render } from "./render";
import { Player } from "./player";
import { ws } from "./ws";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { InputListener } from "./input-listener";

void ws;

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)


//temp

const player = new Player(true)
const arena = new Arena(1200, 720, c);
const objects = [arena, player];


const inputListener = new InputListener({
	default: {
		attack: false,
		use: false,
		backward: false,
		forward: false,
		jump: false,
		left: false,
		right: false
	},
	keymap: {
		KeyW: "forward",
		KeyA: "left",
		KeyS: "backward",
		KeyD: "right",
		Space: "jump",
		0: "attack", // Left mouse button
		2: "use", // Right mouse button
	},
	handleInputs: (inputs) => {
		connection.send({
			type: "client-input",
			...inputs,
		});
	},
	period: SERVER_GAME_TICK,
});

// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(255, 0, 0, 0.01)'
	c.fillRect(0, 0, canvas.width, canvas.height)

	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)
	c.fillText('press A D S W to move', 50, 100)

	await render(objects);
	player.render(c);
	

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}