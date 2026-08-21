import { render } from "./render";
import { Player } from "./player";
import { ws, msg } from "./ws";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { InputListener, defaultInputs } from "./input-listener";
import { SERVER_GAME_TICK } from "@common/index";

void ws;

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)


//temp

const player = new Player(true)
const arena = new Arena(1200, 720, c);
const objects = [arena, player];


const inputListener = new InputListener({
	default: defaultInputs,
	keymap: {
		KeyW: "up",
		KeyA: "left",
		KeyS: "back",
		KeyD: "right",
		Space: "jump",
		0: "attack", // Left mouse button
		2: "use", // Right mouse button
	},
	handleInputs: (inputs) => {
		player.handleInput(inputs);
	},
	period: SERVER_GAME_TICK,
});

// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(40, 150, 50, 0.01)'
	c.fillRect(0, 0, canvas.width, canvas.height)

	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)
	c.fillText('press A D S W to move', 50, 100)

	player.render(canvas)

	// send this player info to server
	msg({location: {x:player.x, y:player.y}});

	// receive other player info

	// render other players

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}