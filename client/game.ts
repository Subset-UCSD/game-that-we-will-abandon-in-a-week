import { Player,  } from "@client/render/player";
import { Arena } from "./render/arena";
import { Room } from "./render/room";
import { Connection } from './net/connection'
import { InputListener } from "./input-listener";
import { addVec, isVecEq, SerializedGameObject, lerp, ChunkMap, Particle, subVec, vecLength } from "@common";
import { defaultInputs, keymap } from "@common/input";
import { WholeFkingGameState, MeatBall, SerializedThing, Line, SerializedCollider, Player as NetPlayer, GameObject } from '@common/game'
import { ClientSeed, ClientExplosion, ClientCorpse, ThingRenderer, render, ClientMeatball, Canvas,  } from "./render"
import { audio, PlaySoundOptions } from '@client/audio/index';
import { number } from "zod";
import { DebugTileEditor } from "./debug/tile-editor";
import { D20 } from "./render/3dObjects/3d";
import { renderTiles } from "./tiles";
import { RenderableObject } from "./render/render"

type Creator = () => RenderableObject

const creators: Record<SerializedGameObject['type'], Creator> = {
	player: () => new Player(),
	d20: () => D20(),
	meatball: () => new ClientMeatball(),
	explosion: () => new ClientExplosion(),
	// enemy:() => new Xyz(),
	seed:() => new ClientSeed(),
	// tree:() => new ThingRenderer(),
	// campfire:() => new ThingRenderer(),
	thing:() => new ThingRenderer(),
	corpse:() => new ClientCorpse(),
}


audio.unlockOnFirstInteraction();
audio.preload({
  	baseTheme: "./assets/music/BaseTheme.wav",
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
	private cilentState: Map<number, RenderableObject> = new Map()

	private arena;
	// private objects;
	private room;
	private __debugText: string = ''
	private debugInfoVisible = false
	private wasDebugKeyPressed = false
	private id = -1;
	// private things: SerializedThingWithAdditionalRenderProperties[] = []
	private lines: Line[] = []
	private debugColldiers: SerializedCollider[] =[ ]
	private currPlayerState?: NetPlayer;
	private tiles: ChunkMap = {}

	private camera: Camera = { x: 0, y: 0, scale: 1 }

	__debugTileEditor?: DebugTileEditor

	constructor() {
		this.arena = new Arena(1200, 720); // small room
		this.room = new Room(); // render players


		this.conn = new Connection(this); //dw about this

		this.inputListener = new InputListener({
			default: defaultInputs,
			keymap: keymap,
			handleInputs: (inputs) => {
				this.conn.send('input', inputs);
				if (inputs.debug && !this.wasDebugKeyPressed) {
					this.debugInfoVisible = !this.debugInfoVisible;
				}
				this.wasDebugKeyPressed = inputs.debug;
			},
			// period: SERVER_GAME_TICK,
		});
		this.inputListener.listen();

		// show D20 while connecting
		const d20 = D20()
		
		this.cilentState.set(-1, d20)
	}

	updateGameState(gameState: WholeFkingGameState) {
		const newClientState = new Map<number, RenderableObject>()
		for (const objState of gameState.gameObjects) {
			const existing = this.cilentState.get(objState.id)?? creators[objState.type]()
			existing.update(objState)
			newClientState.set(
				objState.id,
				existing
			)
			this.cilentState.delete(objState.id)

			switch (objState.type) {
				case "player":
					if (objState.id === this.id) {
						this.currPlayerState = objState
					}	
					break;
			}
		}
		// loop through objects that the server no longer sends over
		for (const [id, object] of this.cilentState) {
			if (object.shouldRemove && !object.shouldRemove()) {
				newClientState.set(id,object)
			}
		}
		this.cilentState = newClientState
		
		const canInteractWithId = this.currPlayerState?.canInteractWith[0]
		if (canInteractWithId !== undefined) {
			const thing = this.cilentState.get(canInteractWithId)
			if (thing instanceof ThingRenderer) {
				thing.canInteract = true
			}
		}
		
		// Instantiate objects for newly appearing updates from the server
		this.__debugText = JSON.stringify({
			...gameState,
			gameObjects:gameState.gameObjects.map(p => p.type==='player'? ({...p,lines:`... ${p.lines.length} line(s)`}):p),
			tiles: Object.fromEntries(Object.entries(gameState.tiles).map(([k,v]) => [k, `... ${v.reduce((cum , curr) => cum + +(curr !== null),0)} tile(s)`]))
		}, null, 2)

		this.lines = gameState.gameObjects.values().flatMap(player => player.type==='player'?player.lines:[]).toArray()
		this.tiles = gameState.tiles

		this.debugColldiers = gameState.debugColliders
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
			const targetZoom = player.probablyafk ? 5 : 1;
			this.camera.x += (player.x - this.camera.x) * 0.2;
			this.camera.y += (player.y - this.camera.y) * 0.2;
			this.camera.scale += (targetZoom - this.camera.scale) * 0.2;
		} else {
			const targetZoom =3
			this.camera.scale += (targetZoom - this.camera.scale) * 0.2;
		}

		const screenShake = this.cilentState.values().reduce((cum, curr) => cum + (curr instanceof ClientExplosion? (1 - Math.min(1, curr.progress * 2) ** 0.3) * 5 * Math.exp(-vecLength(subVec(curr.position, this.camera)) / 500):0), 0) ?? 0

		const { c } = canvas;



	c.fillStyle = this.__debugTileEditor?.isRenderCollider? 'rgba(40, 50, 50, 1)':'black'
	c.fillRect(0, 0, canvas.width, canvas.height)

		c.save();
		c.translate(
			canvas.width / 2,
			canvas.height / 2,
		)
		c.scale(this.camera.scale, this.camera.scale);
		c.translate(
// 			-this.camera.x,
// -this.camera.y,
// i am not sure if this helps with 
			-Math.round(this.camera.x*(this.camera.scale*canvas.dpr)) / (this.camera.scale*canvas.dpr), // + canvas.width/ 2, 
			-Math.round(this.camera.y*(this.camera.scale*canvas.dpr)) / (this.camera.scale*canvas.dpr), // + canvas.height/ 2, 
		);
		const screenShakeAngle = Math.random() * 2 * Math.PI;
		if (screenShake > 0) {
			c.translate(Math.cos(screenShakeAngle) * screenShake, Math.sin(screenShakeAngle) * screenShake);
		}


		// TODO: draw game state
		// this.room.render(canvas);
		// this.arena.render(canvas);

		renderTiles(canvas, this.camera, this.tiles,this.__debugTileEditor?.isRenderCollider)

		if (!player) {
			c.fillStyle = 'red'
		c.fillText('loading...', -17, 50);
		}
		c.fillStyle = 'black';
		c.fillText('fuck', 50, -100);
		c.fillText('press W A S D to move', 50, -50);
		c.fillText('press B to ?', - 300, - 20);
		c.fillText('press P to Paint', - 300, 320);
		c.fillText('Press F to Impregnate.', 300, 20);
		c.fillText('press M to tp', 500, 500);
		c.fillText('press K to knife', 400, -100);

		c.fillStyle = 'black';
		const lines = this.__debugText.split('\n');
		for (const [i, line] of lines.entries()) {
			canvas.context.fillText(line, 0, i * 10)
		}

		//temp test3D shape
		// Cube.render(canvas)

		this.paintLines(c);

		render(canvas, [
			...this.cilentState.values(),
			// ...this.meatballs.values(),
			// ...this.corpses.values(),
			// ...this.things.values().map(thing => new ThingRenderer(thing)),
			// ...this.explosions.values(),
			// ...this.seeds.values()
		])

		if (this.__debugTileEditor != null && this.__debugTileEditor.isRenderCollider) {
			c.strokeStyle = 'red'
		for (const collider of this.debugColldiers) {
			// console.log(collider.type)
			switch (collider.type) {
				case 'box': {
					c.strokeRect(collider.x, collider.y, collider.width, collider.height)
					break
				}
				case 'circle': {
					c.beginPath()
					c.arc(collider.x, collider.y, collider.radius, 0, 2 * Math.PI)
					c.closePath()
					c.stroke()
					
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
		}

		const change = this.__debugTileEditor?.render(canvas, this.camera)
		if (change) {
			this.conn.send('tile-edit', change)
		}

		c.restore()

		if (this.debugInfoVisible && player) {
			c.fillStyle = 'black';
			c.fillText(`player: ${player.id}`, 10, 20);
			c.fillText(`room: ${player.roomId}`, 10, 35);
			c.fillText(`position: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`, 10, 50);
		}
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

	spawnParticles (particle: Particle): void {
		// TODO
	}

}