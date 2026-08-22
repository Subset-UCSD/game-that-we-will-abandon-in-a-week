import { Player } from "./player";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { Room } from "./rooms/room";
import { InputListener} from "./input-listener";
import {Connection} from './connection'
import { SERVER_GAME_TICK } from "@common/index";
import { defaultInputs, keymap } from "@common/input";
import {WholeFkingGameState,MeatBall} from '@common/game'
import {ClientMeatball} from './meatball'


export class Game {
	private conn;
	private inputListener;
	private player;
	private allPlayers: Map<number, Player> = new Map();
	private meatballs = new Map<number, ClientMeatball> ()
	private arena;
	private objects;
	private room;
	private __debugText: string = ''
	private id = -1;
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
	}

	setCurrPlayerId(id: number) {
		this.id = id
	}


	// width, height = screen size (useful for centering things)
	render (canvas: Canvas) {

		// TODO: draw game state
		this.room.render(canvas)
		this.arena.render(canvas)
		this.player.render(canvas)

		for (const otherPlayers of this.allPlayers.values()) {
			otherPlayers.render(canvas)
		}

		for (const mb of this.meatballs.values()) {
			mb.render(canvas)
		}

		const lines = this.__debugText.split('\n')
		for (const [i, line] of lines.entries()){
			canvas.context.fillText(line, 0, canvas.height + (i - lines.length) * 10)
		}
	}

}