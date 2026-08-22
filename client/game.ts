import { Player } from "./player";
import { Canvas} from './canvas'
import { Arena } from "./rooms/arena";
import { Room } from "./rooms/room";
import { InputListener} from "./input-listener";
import {Connection} from './connection'
import { SERVER_GAME_TICK } from "@common/index";
import { defaultInputs, keymap } from "@common/input";


export class Game {
	private conn;
	private inputListener;
	private player;
	private arena;
	private objects;
	private room;
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


		this.conn = new Connection();
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





}