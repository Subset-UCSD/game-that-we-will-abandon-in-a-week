import { Player, SLEEP_TIME } from "@client/render/player";
import { Arena } from "./render/arena";
import { Room } from "./render/room";
import { Connection } from './net/connection'
import { InputListener } from "./input-listener";
import { addVec, isVecEq, SERVER_GAME_TICK,lerp, ChunkMap } from "@common";
import { defaultInputs, keymap } from "@common/input";
import { WholeFkingGameState, MeatBall, SerializedThing, Line, SerializedCollider, Player as NetPlayer } from '@common/game'
import { ClientSeed, ClientExplosion, ClientCorpse, ThingRenderer, render, ClientMeatball, Canvas, SerializedThingWithAdditionalRenderProperties } from "./render"
import { audio, PlaySoundOptions } from '@client/audio/index';
import { number } from "zod";
import { DebugTileEditor } from "./debug/tile-editor";
import { Cube } from "./render/3dObjects/3d";
import { renderTiles } from "./tiles";

audio.unlockOnFirstInteraction();
audio.preload({
	footstep: [
		"./assets/sounds/Footstep1.wav",
		"./assets/sounds/Footstep2.wav",
		"./assets/sounds/Footstep3.wav",
		"./assets/sounds/Footstep4.wav"
	],
	baaa: [
		"./assets/sounds/baaa1.wav",
		"./assets/sounds/baaa2.wav",
		"./assets/sounds/baaa3.wav",
		"./assets/sounds/baaa4.wav"
	],
});

export type Camera = {
	x: number
	y: number
	scale: number
}

export class Game {
	private conn;
	private inputListener;
	private players: Map<number, Player> = new Map();
	private meatballs = new Map<number, ClientMeatball>()
	private corpses = new Map<number, ClientCorpse>()
	private explosions = new Map<number, ClientExplosion>()
	private seeds = new Map<number, ClientSeed>();
	private arena;
	// private objects;
	private room;
	private __debugText: string = ''
	private id = -1;
	private things: SerializedThingWithAdditionalRenderProperties[] = []
	private lines: Line[] = []
	private debugColldiers: SerializedCollider[] =[ ]
	private currPlayerState?: NetPlayer;
	private tiles: ChunkMap = {}

	private camera: Camera = { x: 0, y: 0, scale: 1 }

	__debugTileEditor?: DebugTileEditor

	//temp
	private Test3dShape = new Cube();

	constructor() {
		this.arena = new Arena(1200, 720); // small room
		this.room = new Room(); // render players


		this.conn = new Connection(this); //dw about this

		this.inputListener = new InputListener({
			default: defaultInputs,
			keymap: keymap,
			handleInputs: (inputs) => {
				this.conn.send('input', inputs);
			},
			// period: SERVER_GAME_TICK,
		});
		this.inputListener.listen();
	}

	updateGameState(gameState: WholeFkingGameState) {
		// Instantiate objects for newly appearing updates from the server
		this.__debugText = JSON.stringify({
			...gameState,
			tiles: Object.fromEntries(Object.entries(gameState.tiles).map(([k,v]) => [k, `... ${v.reduce((cum , curr) => cum + +(curr !== null),0)} tile(s)`]))
		}, null, 2)

		const newPlayers = new Map<number, Player>()
		for (const playerUpdate of gameState.players.values()) {
			const existing = this.players.get(playerUpdate.id)
			if (existing) {
				existing.update(playerUpdate);
				newPlayers.set(playerUpdate.id, existing)
			} else {
				newPlayers.set(playerUpdate.id, new Player(playerUpdate))
			}
			
			if (playerUpdate.id === this.id) {
				this.currPlayerState = playerUpdate
			}
		}
		this.players = newPlayers

		const newMeatballs = new Map<number, ClientMeatball>()
		for (const meatball of gameState.meatballs) {
			if (!this.meatballs.get(meatball.id)) this.playAudioAtPosition('baaa', meatball.x, meatball.y, 500, { playbackRate: 1 + Math.random() * 0.2 });
			let existing = this.meatballs.get(meatball.id) ?? new ClientMeatball()
			existing.setState(meatball)
			newMeatballs.set(meatball.id, existing)
		}
		this.meatballs = newMeatballs

		this.things = gameState.things.map(thing => ({...thing, canInteract: this.currPlayerState?.canInteractWith[0] === thing.id}))

		const newSeeds = new Map<number, ClientSeed>();
		for (const seed of gameState.seeds) {
			newSeeds.set(seed.id, this.seeds.get(seed.id) ?? new ClientSeed(seed));
		}
		this.seeds = newSeeds;

		const newCorpses = new Map<number, ClientCorpse>()
		for (const meatball of gameState.corpses) {
			let existing = this.corpses.get(meatball.id) ?? new ClientCorpse()
			existing.state = meatball
			newCorpses.set(meatball.id, existing)
		}
		this.corpses = newCorpses
		// console.log("no restarts?")

		for (const explosion of gameState.explosions) {
			if (!this.explosions.has(explosion.id)) {
				this.explosions.set(explosion.id, new ClientExplosion(explosion))
			}
		}
		this.explosions = new Map(this.explosions.entries().filter(([, x]) => !x.shouldDie))

		this.lines = gameState.players.values().flatMap(player => player.lines).toArray()
		this.tiles = gameState.tiles

		this.debugColldiers = gameState.colliders
	}

	setCurrPlayerId(id: number) {
		this.id = id
	}

	// abstract playing a sound at a position in the world, with panning and volume based on distance from player
	playAudioAtPosition(name: string, x: number, y: number, detectableDistance: number = 500,  playSoundOptions?: PlaySoundOptions) {
		// get x position of item on screen for audio panning
		const pan = (x - this.camera.x) / (this.arena.width / 2);
		// get distance of item from player for audio volume
		const distance = Math.sqrt((x - this.camera.x) ** 2 + (y - this.camera.y) ** 2);
		const volume = Math.max(0, 1 - distance / detectableDistance) * (playSoundOptions?.volume ?? 1);
		audio.play(name, { ...playSoundOptions, pan, volume });
	}

	// callback function to play a footstep sound inside Player class
	footstepSoundCallback = (x: number, y: number) => {
		this.playAudioAtPosition('footstep', x, y);
	}

	// width, height = screen size (useful for centering things)
	render(canvas: Canvas) {
		// if (this.id == -1) return
		
		const player = this.currPlayerState
		if (player ) {
			const targetZoom = player.timeSinceLastInput > SLEEP_TIME ? 5 : 1;
			this.camera.x += (player.x - this.camera.x) * 0.2;
			this.camera.y += (player.y - this.camera.y) * 0.2;
			this.camera.scale += (targetZoom - this.camera.scale) * 0.2;
		}

		const screenShake = this.explosions.values().reduce((cum, curr) => cum + (1 - Math.min(1, curr.progress * 2) ** 0.3) * 5, 0) ?? 0

		const { c } = canvas;
		c.save();
		c.translate(
			canvas.width / 2,
			canvas.height / 2,
		)
		c.scale(this.camera.scale, this.camera.scale);
		c.translate(
			-this.camera.x, // + canvas.width/ 2, 
			-this.camera.y, // + canvas.height/ 2, 
		);
		const screenShakeAngle = Math.random() * 2 * Math.PI;
		if (screenShake > 0) {
			c.translate(Math.cos(screenShakeAngle) * screenShake, Math.sin(screenShakeAngle) * screenShake);
		}


		// TODO: draw game state
		this.room.render(canvas);
		this.arena.render(canvas);

		renderTiles(canvas, this.camera, this.tiles)

		c.fillStyle = 'black';
		c.fillText('fuck', 50, -100);
		c.fillText('press W A S D to move', 50, -50);
		c.fillText('press B to ?', - 300, - 20);
		c.fillText('press P to Paint', - 300, 320);

		c.fillStyle = 'black';
		const lines = this.__debugText.split('\n');
		for (const [i, line] of lines.entries()) {
			canvas.context.fillText(line, 0, i * 10)
		}


		//temp test3D shape
		this.Test3dShape.render(canvas)


		
		this.paintLines(c);

		render(canvas, [
			...this.players.values(),
			...this.meatballs.values(),
			...this.corpses.values(),
			...this.things.values().map(thing => new ThingRenderer(thing)),
			...this.explosions.values(),
			...this.seeds.values()
		])

		c.strokeStyle = 'red'
		for (const collider of this.debugColldiers) {
			switch (collider.type) {
				case 'box': {
					c.strokeRect(collider.x, collider.y, collider.width, collider.height)
					break
				}
				case 'capsule': {
					// untested
					c.beginPath()
					c.moveTo(collider.x + collider.width/2, collider.y + collider.height/2)
					if (collider.width > collider.height) {
						// horizontal
					c.lineTo(collider.x - collider.width/2, collider.y + collider.height/2)
					c.arc(collider.x - collider.width/2, collider.y, collider.height/2, Math.PI/4, 3*Math.PI/4)
					c.lineTo(collider.x + collider.width/2, collider.y - collider.height/2)
					c.arc(collider.x + collider.width/2, collider.y, collider.height/2, -Math.PI/4, Math.PI/4)
					} else {
						
					c.arc(collider.x, collider.y + collider.height/2, collider.width/2, 0, Math.PI/2)
					c.lineTo(collider.x - collider.width/2, collider.y - collider.height/2)
					c.arc(collider.x, collider.y - collider.height/2, collider.width/2, -Math.PI/2, 0)
					c.closePath()
					}
					c.stroke()
					break
				}
			}
		}

		const change = this.__debugTileEditor?.render(canvas, this.camera)
		if (change) {
			this.conn.send('tile-edit', change)
		}

		c.restore()
	}

	private	paintLines(c: CanvasRenderingContext2D) {
		c.save()
		// null age means it's fresh (age=0) AND to lift the end up to connect to the sheep ass
		const playerLineGroups = Map.groupBy(this.lines, line => line.age === 0 || line.age === null ? (line.age !== null && isVecEq(line.start, line.end) ? 'fresh-dot' : 'fresh') : line.age === 1 ? (isVecEq(line.start, line.end) ? 'aged-dot' : 'aged') : 'aging')
		const LINE_RADIUS = 5;
		c.lineWidth = LINE_RADIUS * 2;
		c.lineCap = 'round';
		// fresh: rgb(54,26,9)
		// aged: rgb(33,101,6)
		const lineColor = (age: number) => `rgb(${lerp(54, 33, age)}, ${lerp(26, 101, age)}, ${lerp(9, 6, age)})`;
		// hollllyyy hell. wtf?? is this
		for (const groupKey of ['aged', 'aged-dot', 'aging', 'fresh', 'fresh-dot'] as const) {
			const group = playerLineGroups.get(groupKey)
			if (!group) continue
			if (groupKey !== 'aging') {
				c.beginPath()
				const color = lineColor(groupKey.startsWith('aged') ? 1 : 0)
				if (groupKey === 'aged-dot' || groupKey === 'fresh-dot') {
					c.fillStyle = color
				} else {
					c.strokeStyle = color
				}
			}
			for (const { start, end, age } of group) {
				const isEq = groupKey === 'aged' ? age !== null && isVecEq(start, end) : groupKey.includes('dot')
				if (groupKey === 'aging') {
					c.beginPath()
					const color = lineColor(age ?? 0)
					if (isEq) c.fillStyle = color
					else c.strokeStyle = color
				}
				if (isEq) {
					c.moveTo(start.x + LINE_RADIUS, start.y)
					c.arc(end.x, end.y, LINE_RADIUS, 0, 2 * Math.PI)
					if (groupKey === 'aging') c.fill()
				} else {
					let realEnd = age === null ? addVec(end, { x: 0, y: -10 }) : end
					if (age === null && isVecEq(realEnd, start)) {
						realEnd = addVec(end, { x: 0.1, y: 0 })
					}
					c.moveTo(start.x, start.y)
					c.lineTo(realEnd.x, realEnd.y)
					if (groupKey === 'aging') c.stroke() // 🍆
				}
			}
			if (groupKey === 'aged-dot' || groupKey === 'fresh-dot') {
				c.fill()
			}
			if (groupKey === 'aged' || groupKey === 'fresh') {
				c.stroke()
			}
		}
		c.restore()
	}

}