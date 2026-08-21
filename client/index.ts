import { render } from "./render";
import { Player } from "./player";

const canvas = document.getElementById('canvas')
if (!(canvas instanceof HTMLCanvasElement)) {
	throw new Error('Expected a canvas #canvas')
}
const c = canvas.getContext('2d')
if (!c) {
	throw new Error('where is the context...')
}

//temp



// Game loop
while (true) {
	// TEMP: just for demo purposes, please ignore
	c.fillStyle = 'rgba(255, 0, 0, 0.01)'
	c.fillRect(0, 0, canvas.width, canvas.height)


	c.fillStyle = 'black'
	c.fillText('fuck', 50, 50)


	

	// Wait for one frame (1/60 of a second on a 60 Hz, but can be shorter for high refresh displays)
	await new Promise(window.requestAnimationFrame)
}