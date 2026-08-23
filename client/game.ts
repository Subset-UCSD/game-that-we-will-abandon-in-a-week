import { Player } from "./player";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { Room } from "./rooms/room";
import { InputListener} from "./input-listener";
import {Connection} from './connection'
import { SERVER_GAME_TICK } from "@common";
import { defaultInputs, keymap } from "@common/input";
import {WholeFkingGameState,MeatBall, SerializedThing} from '@common/game'
import {ClientMeatball} from './meatball'
import { render } from "./render";
import { ThingRenderer } from "./thing-renderer";
import {ClientCorps} from './courpse'
import { ClientExplosion } from "./explosion";


export class Game {
	private conn;
	private inputListener;
	private player;
	private allPlayers: Map<number, Player> = new Map();
	private meatballs = new Map<number, ClientMeatball> ()
	private corpses = new Map<number, ClientCorps> ()
	private explosions = new Map<number, ClientExplosion> ()
	private arena;
	private objects;
	private room;
	private __debugText: string = ''
	private id = -1;
	private things: SerializedThing[] = []

	private camera = {x:0,y:0,scale:1}

	// private gameState:WholeFkingGameState = {
	// 	players:[]
	// };
	// your game local state
	// orchestrates rendering
	// orchestrates storing the local game world
	// exposes functions that can be called in response to server messages
	constructor() {
		
		// need to handle this differently later
		this.player = new Player(true)
		this.arena = new Arena(1200, 720); // small room
		this.objects = [this.arena, this.player];
		this.room = new Room(); // render players

		
		this.conn = new Connection(this); //dw about this
		
		this.inputListener = new InputListener({
			default: defaultInputs,
			keymap: keymap,
			handleInputs: (inputs) => {
				this.conn.send('input', inputs);
			},
			period: SERVER_GAME_TICK,
		});
		this.inputListener.listen();
	}

	updateGameState(gameState:WholeFkingGameState) {
		// this.gameState = gameState
		// bro is a dunder fan (double underscore)
		this.__debugText = JSON.stringify(gameState, null, 2)
		// console.log('gamer state',gameState)
		// TODO: assign things from gameState into Game properties

		for (const playerUpdate of gameState.players.values()) {
			if (this.allPlayers.has(playerUpdate.id)) {
				this.allPlayers.get(playerUpdate.id)?.updatePlayerState(playerUpdate)
			}
			else if (playerUpdate.id != this.id) {
				const newPlayer = new Player(false)
				newPlayer.updatePlayerState(playerUpdate)
				this.allPlayers.set(playerUpdate.id, newPlayer)
			}
			else {
				this.player.updatePlayerState(playerUpdate)
				// this.allPlayers.set(playerUpdate.id, this.player)
			}
		}

		const newMeatballs = new Map<number, ClientMeatball> ()
		for (const meatball of gameState.meatballs) {
			let existing =	this.meatballs.get(meatball.id) ?? new ClientMeatball()
			existing.state = meatball
			newMeatballs.set(meatball.id, existing)
		}
		this.meatballs = newMeatballs

		this.things = gameState.things


		const newCorpses = new Map<number, ClientCorps> ()
		for (const meatball of gameState.corpses) {
			let existing =	this.corpses.get(meatball.id) ?? new ClientCorps()
			existing.state = meatball
			newCorpses.set(meatball.id, existing)
		}
		this.corpses = newCorpses

		
		for (const plosion of gameState.explosions) {
			if (!this.explosions.has(plosion.id)) {
				this.explosions.set(plosion.id, new ClientExplosion(plosion))
			}
		}
		this.explosions = new Map(this.explosions.entries().filter(([, plosion]) => !plosion.shouldDie))
	}

	setCurrPlayerId(id: number) {
		this.id = id
	}


	// width, height = screen size (useful for centering things)
	render (canvas: Canvas) {
		const targetZoom = this.player.isAsleep() ? 5 : 1
		this.camera.x += (this.player.x - this.camera.x) * 0.2
		this.camera.y += (this.player.y - this.camera.y) * 0.2
		this.camera.scale += (targetZoom - this.camera.scale) * 0.2

		const screenShake = this.explosions.values().reduce((cum, curr) => cum + (1 - Math.min(1, curr.progress * 2)**0.3) * 5, 0)


		const {c} = canvas
		c.save()
		c.translate(
			canvas.width/ 2, 
			canvas.height/ 2, 
		)
		c.scale(this.camera.scale, this.camera.scale)
		c.translate(
			-this.camera.x, // + canvas.width/ 2, 
			-this.camera.y, // + canvas.height/ 2, 
		)
		const screenShakeAngle = Math.random() * 2 * Math.PI
		if (screenShake > 0) {
			c.translate(Math.cos(screenShakeAngle) * screenShake, Math.sin(screenShakeAngle) * screenShake)
		}


		// TODO: draw game state
		this.room.render(canvas)
		this.arena.render(canvas)


	c.fillStyle = 'black'
	c.fillText('fuck', 50, -100)
	c.fillText('press W A S D to move', 50, -50)
	c.fillText('press B to ?',  - 300,  - 20)

	

		c.fillStyle = 'black'
		const lines = this.__debugText.split('\n')
		for (const [i, line] of lines.entries()){
			canvas.context.fillText(line, 0,  i * 10)
		}


		render(canvas, [
			this.player,
			...this.allPlayers.values(),
			...this.meatballs.values(),
			...this.corpses.values(),
			...this.things.values().map(thing => new ThingRenderer(thing)),
			...this.explosions.values(),
		])

		c.restore()
	}

}