import { render } from "./render";
import { Player } from "./player";
import { ws, msg, setRoom } from "./ws";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { Room } from "./rooms/room";
import { defaultInputs, keymap } from "@common/input";
import { InputListener} from "./input-listener";
import { SERVER_GAME_TICK } from "@common/index";

// temp to get it to link
void ws;

using canvas = new Canvas()
const c = canvas.context
document.body.append(canvas.canvas)

//temp


// const game = new Game();

// function handleIncomingMessage(msg: ) {
// 	switch(type) {
// 		case "myupdate":


// 	}
// }

const player = new Player(true)
const arena = new Arena(1200, 720); // small room
const objects = [arena, player];
const room = new Room(); // render players
setRoom(room);

const inputListener = new InputListener({
	default: defaultInputs,
	keymap: keymap,
	handleInputs: (inputs) => {
		player.handleInput(inputs);
	},
	period: SERVER_GAME_TICK,
});
inputListener.listen();

// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(40, 150, 50, 1)'
	c.fillRect(0, 0, canvas.width, canvas.height)

	arena.render(canvas)

	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)
	c.fillText('press W A S D to move', 50, 100)

	
	player.render(canvas)

	// send this player info to server
	msg({location: {x:player.x, y:player.y}});

	// render other players
	room.render(canvas);

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}