import { audio } from "@client/audio/index";
import { Player } from "@client/render/player";
import {
	addVec,
	type ChunkMap,
	isVecEq,
	lerp,
	type Particle,
	type SerializedGameObject,
	type SoundEvent,
	subVec,
	vec2,
	vecLength,
} from "@common";
import type { Line, Player as NetPlayer, SerializedCollider, WholeFkingGameState } from "@common/game";
import { defaultInputs, keymap } from "@common/input";
import { mat4, vec3 } from "gl-matrix";
import type { DebugTileEditor } from "./debug/tile-editor";
import { InputListener } from "./input-listener";
import { Connection } from "./net/connection";
import { Canvas, ClientExplosion, ClientMeatball, ClientSeed, render, ThingRenderer } from "./render";
import { D20 } from "./render/3dObjects/3d";
import { Arena } from "./render/arena";
import { Anemone } from "./render/enemy";
import { ClientParticle } from "./render/particle";
import type { RenderableObject } from "./render/render";
import { Room } from "./render/room";
import { GlTileRenderer, renderTiles } from "./tiles";
import { renderInventory } from "./render/inventory";

type Creator = () => RenderableObject;

const creators: Record<SerializedGameObject["type"], Creator> = {
	player: () => new Player(),
	d20: () => D20(),
	meatball: () => new ClientMeatball(),
	explosion: () => new ClientExplosion(),
	enemy: () => new Anemone(),
	seed: () => new ClientSeed(),
	// tree:() => new ThingRenderer(),
	// campfire:() => new ThingRenderer(),
	thing: () => new ThingRenderer(),
	// corpse: () => new ClientCorpse(),
};

audio.unlockOnFirstInteraction();
// TODO: we should make audio ID a constnat defined in messages.ts / common
audio.preload({
	baseTheme: "./assets/music/ShopTheme.wav",
	footstep: [
		"./assets/sounds/Footstep1.wav",
		"./assets/sounds/Footstep2.wav",
		"./assets/sounds/Footstep3.wav",
		"./assets/sounds/Footstep4.wav",
	],
	baaa: [
		"./assets/sounds/baaa1.wav",
		"./assets/sounds/baaa2.wav",
		"./assets/sounds/baaa3.wav",
		"./assets/sounds/baaa4.wav",
	],
});

export type Camera = {
	x: number;
	y: number;
	scale: number;
};

export class Game {
	private conn;
	private inputListener;
	private cilentState: Map<number, RenderableObject> = new Map();

	private arena;
	// private objects;
	private room;
	private __debugText: string = "";
	private debugInfoVisible = false;
	private wasDebugKeyPressed = false;
	private id = -1;
	// private things: SerializedThingWithAdditionalRenderProperties[] = []
	private lines: Line[] = [];
	private debugColldiers: SerializedCollider[] = [];
	private currPlayerState?: NetPlayer;
	private tiles: ChunkMap = {};
	private particles: ClientParticle[] = [];
	private lastRenderTime = Date.now();
	private canvas = new Canvas();
	// TEMP
	private vao = this.canvas.gl.gl.createVertexArray();
	private tileRenderer = new GlTileRenderer(this.canvas);

	private camera: Camera = { x: 0, y: 0, scale: 1 };

	__debugTileEditor?: DebugTileEditor;

	constructor() {
		this.arena = new Arena(1200, 720); // small room
		this.room = new Room(); // render players

		this.conn = new Connection(this); //dw about this

		this.inputListener = new InputListener({
			default: defaultInputs,
			keymap: keymap,
			handleInputs: (inputs) => {
				this.conn.send("input", inputs);
				if (inputs.debug && !this.wasDebugKeyPressed) {
					this.debugInfoVisible = !this.debugInfoVisible;
				}
				this.wasDebugKeyPressed = inputs.debug;
			},
			// period: SERVER_GAME_TICK,
		});
		this.inputListener.listen();

		// show D20 while connecting
		const d20 = D20(true);

		this.cilentState.set(-1, d20);

		document.body.append(this.canvas.glCanvas);
		document.body.append(this.canvas.canvas);

		//TEMP HOW TO USE WEBGL

		const gl = this.canvas.gl.gl;

		/// We can initialize vertices once here
		gl.bindVertexArray(this.vao);

		// PUT VERTICES IN BUFFER
		const buffer = gl.createBuffer(); // ?? expect("buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-10, -10, 10, -10, 10, 10]), gl.STATIC_DRAW);

		//GET ATTRIBUTE IN .VERT
		const location = this.canvas.gl.testShader.attribMaybe("a_position");
		if (location !== null) {
			// BIND ATT TO OUR BUFFERS
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(
				location,
				2, // vec2
				gl.FLOAT,
				false, // normalized - has no effect on floats
				0, // stride; 0 means "tightly packed"
				0, // offset
			);
		}

		//cleanup
		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		{
			const location = this.canvas.gl.tileShader.attribMaybe("a_position");
			if (location !== null) {
				// BIND ATT TO OUR BUFFERS
				gl.bindBuffer(gl.ARRAY_BUFFER, this.canvas.gl.imagePlanePositions);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(
					location,
					2, // vec2
					gl.FLOAT,
					false, // normalized - has no effect on floats
					0, // stride; 0 means "tightly packed"
					0, // offset
				);
			}

			//cleanup
			gl.bindVertexArray(null);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}

	recieveTRiles(tiles: ChunkMap) {
		this.tiles = tiles;
	}

	updateGameState(gameState: WholeFkingGameState) {
		const newClientState = new Map<number, RenderableObject>();
		for (const objState of gameState.gameObjects) {
			const existing = this.cilentState.get(objState.id) ?? creators[objState.type]();
			existing.update(objState);
			newClientState.set(objState.id, existing);
			this.cilentState.delete(objState.id);

			switch (objState.type) {
				case "player":
					if (objState.id === this.id) {
						this.currPlayerState = objState;
					}
					break;
			}
		}
		// loop through objects that the server no longer sends over
		for (const [id, object] of this.cilentState) {
			if (object.shouldRemove && !object.shouldRemove()) {
				newClientState.set(id, object);
			}
		}
		this.cilentState = newClientState;

		const canInteractWithId = this.currPlayerState?.canInteractWith[0];
		if (canInteractWithId !== undefined) {
			const thing = this.cilentState.get(canInteractWithId);
			if (thing instanceof ThingRenderer) {
				thing.canInteract = true;
			}
		}

		// Instantiate objects for newly appearing updates from the server
		this.__debugText = JSON.stringify(
			{
				...gameState,
				gameObjects: gameState.gameObjects.map((p) =>
					p.type === "player" ? { ...p, lines: `... ${p.lines.length} line(s)` } : p,
				),
			},
			null,
			2,
		);

		this.lines = gameState.gameObjects
			.values()
			.flatMap((player) => (player.type === "player" ? player.lines : []))
			.toArray();
		// this.tiles = gameState.tiles;

		this.debugColldiers = gameState.debugColliders;
	}

	setCurrPlayerId(id: number) {
		this.id = id;
	}

	// abstract playing a sound at a position in the world, with panning and volume based on distance from player
	playAudioAtPosition({ name, x, y, detectableDistance = 500, volume: volumeFromEvent = 1, playbackRate }: SoundEvent) {
		// get x position of item on screen for audio panning
		const pan = (x - this.camera.x) / (this.arena.width / 2);
		// get distance of item from player for audio volume
		const distance = Math.sqrt((x - this.camera.x) ** 2 + (y - this.camera.y) ** 2);
		const volume = Math.max(0, 1 - distance / detectableDistance) * (volumeFromEvent ?? 1);
		audio.play(name, { playbackRate, pan, volume });
	}

	// callback function to play a footstep sound inside Player class
	footstepSoundCallback = (x: number, y: number) => {
		// this.playAudioAtPosition("footstep", x, y);
	};

	// width, height = screen size (useful for centering things)
	render() {
		const canvas = this.canvas;
		const now = Date.now();
		// if (this.id == -1) return

		const player = this.currPlayerState;
		if (player) {
			const targetZoom = player.probablyafk ? 5 : 1;
			this.camera.x += (player.x - this.camera.x) * 0.2;
			this.camera.y += (player.y - this.camera.y) * 0.2;
			this.camera.scale += (targetZoom - this.camera.scale) * 0.2;
		} else {
			const targetZoom = 3;
			this.camera.scale += (targetZoom - this.camera.scale) * 0.2;
		}

		const screenShake =
			this.cilentState
				.values()
				.reduce(
					(cum, curr) =>
						cum +
						(curr instanceof ClientExplosion
							? (1 - Math.min(1, curr.progress * 2) ** 0.3) *
								5 *
								Math.exp(-vecLength(subVec(curr.position, this.camera)) / 500)
							: 0),
					0,
				) ?? 0;

		const { c, gl } = canvas;

		// c.fillStyle = this.__debugTileEditor?.isRenderCollider ? "rgba(40, 50, 50, 1)" : "black";
		// gl.clearColor(...(this.__debugTileEditor?.isRenderCollider ? [40/255, 50/255, 50/255 ]as const : [0,0,0]as const),1)
		gl.clear(this.__debugTileEditor?.isRenderCollider ? [40 / 255, 50 / 255, 50 / 255] : [0, 0, 0]);
		// if (this.__debugTileEditor?.isRenderCollider ) {
		// 	gl.clearColor(40/255, 50/255, 50/255 ,1)
		// } else {
		// 	gl.clearColor(0,0,0,1)
		// }
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		c.clearRect(0, 0, canvas.width, canvas.height);

		//TODO add camera class to clean this up YIPPEEEE

		const cameraTransformation = mat4.create();
		// scale down [-canvas.width / 2, canvas.width / 2] to [-1, 1]
		// also flip webgl vertically so +Y is down to match canvas2d
		mat4.scale(cameraTransformation, cameraTransformation, vec3.fromValues(2 / canvas.width, -2 / canvas.height, 1));
		c.save();
		c.translate(canvas.width / 2, canvas.height / 2); //done by webgl
		// webgl and canvas2d have same coord system at this point

		c.scale(this.camera.scale, this.camera.scale);
		mat4.scale(cameraTransformation, cameraTransformation, vec3.fromValues(this.camera.scale, this.camera.scale, 1));

		// unnessary in webgl
		// HACK align (canvas2D) camera to nearest pixel to hopefully avoid gaps in tiles
		c.translate(
			// 			-this.camera.x,
			// -this.camera.y,
			// i am not sure if this helps with
			-Math.round(this.camera.x * (this.camera.scale * canvas.dpr)) / (this.camera.scale * canvas.dpr), // + canvas.width/ 2,
			-Math.round(this.camera.y * (this.camera.scale * canvas.dpr)) / (this.camera.scale * canvas.dpr), // + canvas.height/ 2,
		);
		mat4.translate(cameraTransformation, cameraTransformation, vec3.fromValues(-this.camera.x, -this.camera.y, 0));
		const screenShakeAngle = Math.random() * 2 * Math.PI;
		let shake = vec2();
		if (screenShake > 0) {
			// const shake = scaleVec(randomInCircle(), screenShake)
			shake = vec2(Math.cos(screenShakeAngle) * screenShake, Math.sin(screenShakeAngle) * screenShake);
			c.translate(shake.x, shake.y);
			mat4.translate(cameraTransformation, cameraTransformation, vec3.fromValues(shake.x, shake.y, 0));
		}

		//TEMP HOW TO USE WEBGL
		gl.beginRender();

		this.tileRenderer.renderTilesGl(this.camera, shake, this.tiles);

		gl.testShader.use();

		//camera view
		gl.gl.uniformMatrix4fv(gl.testShader.uniform("u_view"), false, cameraTransformation);
		gl.gl.bindVertexArray(this.vao);
		gl.gl.drawArraysInstanced(
			gl.gl.TRIANGLES,
			0, //Start index
			3, //number of vertices
			1, // number of instances
		);
		gl.gl.bindVertexArray(null);

		gl.applyFilters();

		// TODO: draw game state
		// this.room.render(canvas);
		// this.arena.render(canvas);w

		renderTiles(canvas, this.camera, this.tiles, this.__debugTileEditor?.isRenderCollider);

		if (!player) {
			c.fillStyle = "red";
			c.fillText("loading...", -17, 50);
		}
		c.fillStyle = "black";
		c.fillText("fuck", 50, -100);
		c.fillText("press W A S D to move", 50, -50);
		c.fillText("press B to ?", -300, -20);
		c.fillText("press P to Paint", -300, 320);
		c.fillText("Press F to Impregnate.", 300, 20);
		c.fillText("press M to tp", 500, 500);
		c.fillText("press K to knife", 400, -100);

		c.fillStyle = "black";
		const lines = this.__debugText.split("\n");
		for (const [i, line] of lines.entries()) {
			canvas.context.fillText(line, 0, i * 10);
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
		]);

		const djt = (now - this.lastRenderTime) / 1000;
		this.particles = this.particles.filter((particle) => {
			if (particle.shouldRemove()) return false;
			particle.tick(djt);
			particle.render(canvas);
			return true;
		});

		if (this.__debugTileEditor != null && this.__debugTileEditor.isRenderCollider) {
			c.strokeStyle = "red";
			for (const collider of this.debugColldiers) {
				// is this correct ?
				const withOffset = addVec(collider.position,collider.offset)
				// console.log(collider.type)
				switch (collider.type) {
					case "box": {
						c.strokeRect(
							withOffset.x - collider.width / 2,
							withOffset.y - collider.height / 2,
							collider.width,
							collider.height,
						);
						break;
					}
					case "circle": {
						c.beginPath();
						c.arc(withOffset.x, withOffset.y, collider.radius, 0, 2 * Math.PI);
						c.closePath();
						c.stroke();

						break;
					}
					/*case "capsule": {
						// untested
						c.beginPath();
						c.moveTo(collider.x + collider.width / 2, collider.y + collider.height / 2);
						if (collider.width > collider.height) {
							// horizontal
							c.lineTo(collider.x - collider.width / 2, collider.y + collider.height / 2);
							c.arc(collider.x - collider.width / 2, collider.y, collider.height / 2, Math.PI / 4, (3 * Math.PI) / 4);
							c.lineTo(collider.x + collider.width / 2, collider.y - collider.height / 2);
							c.arc(collider.x + collider.width / 2, collider.y, collider.height / 2, -Math.PI / 4, Math.PI / 4);
						} else {
							c.arc(collider.x, collider.y + collider.height / 2, collider.width / 2, 0, Math.PI / 2);
							c.lineTo(collider.x - collider.width / 2, collider.y - collider.height / 2);
							c.arc(collider.x, collider.y - collider.height / 2, collider.width / 2, -Math.PI / 2, 0);
							c.closePath();
						}
						c.stroke();
						break;
					}*/
				}
			}
		}

		const change = this.__debugTileEditor?.render(canvas, this.camera);
		if (change) {
			this.conn.send("tile-edit", change);
		}

		c.restore();


		renderInventory(canvas,player?.items??[])
		// for (const [i, {item, count}] of (player?.items ?? []).entries()) {
		// 	//
		// }

		if (player?.dialogue) {
			c.fillStyle = "black";
			c.beginPath();
			c.moveTo(35 - Math.random() * 40, canvas.height - 40 - 200 - 5 - Math.random() * 40);
			c.lineTo(canvas.width - 35 + Math.random() * 40, canvas.height - 40 - 200 - 5 - Math.random() * 40);
			c.lineTo(canvas.width - 35 + Math.random() * 40, canvas.height - 35 + Math.random() * 40);
			c.lineTo(35 - Math.random() * 40, canvas.height - 35 + Math.random() * 40);
			c.fill();
			c.fillStyle = "white";
			c.fillRect(40, canvas.height - 40 - 200, canvas.width - 80, 200);
			c.fillStyle = "black";
			c.fillText(player.dialogue.messagfe, 80, canvas.height - 40 - 150);
			c.strokeStyle = "black";
			for (const [i, { text, active }] of player.dialogue.options.entries()) {
				c.strokeRect(80 + i * 100, canvas.height - 80, 90, 20);
				c.fillText(text, 80 + i * 100, canvas.height - 70);
				if (active) {
					c.strokeRect(80 + i * 100, canvas.height - 82, 90, 20);
					c.fillText("v".repeat(active), 80 + i * 100, canvas.height - 80);
				}
				// c.fill
			}
			c.fillStyle = "grey";
			c.fillText("hint: press SPACE when the v is above the option yo ulike", 80, canvas.height - 100);
		}

		if (this.debugInfoVisible && player) {
			c.fillStyle = "black";
			c.fillText(`player: ${player.id}`, 10, canvas.height-20);
			c.fillText(`room: ${player.roomId}`, 10, canvas.height-35);
			c.fillText(`position: ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`, 10,canvas.height- 50);
		}

		this.lastRenderTime = now;

		// canvas.checkError()
	}

	private paintLines(c: CanvasRenderingContext2D) {
		c.save();
		// null age means it's fresh (age=0) AND to lift the end up to connect to the sheep ass
		const playerLineGroups = Map.groupBy(this.lines, (line) =>
			line.age === 0 || line.age === null
				? line.age !== null && isVecEq(line.start, line.end)
					? "fresh-dot"
					: "fresh"
				: line.age === 1
					? isVecEq(line.start, line.end)
						? "aged-dot"
						: "aged"
					: "aging",
		);
		const LINE_RADIUS = 5;
		c.lineWidth = LINE_RADIUS * 2;
		c.lineCap = "round";
		// fresh: rgb(54,26,9)
		// aged: rgb(33,101,6)
		const lineColor = (age: number) => `rgb(${lerp(54, 33, age)}, ${lerp(26, 101, age)}, ${lerp(9, 6, age)})`;
		// hollllyyy hell. wtf?? is this
		for (const groupKey of ["aged", "aged-dot", "aging", "fresh", "fresh-dot"] as const) {
			const group = playerLineGroups.get(groupKey);
			if (!group) continue;
			if (groupKey !== "aging") {
				c.beginPath();
				const color = lineColor(groupKey.startsWith("aged") ? 1 : 0);
				if (groupKey === "aged-dot" || groupKey === "fresh-dot") {
					c.fillStyle = color;
				} else {
					c.strokeStyle = color;
				}
			}
			for (const { start, end, age } of group) {
				const isEq = groupKey === "aged" ? age !== null && isVecEq(start, end) : groupKey.includes("dot");
				if (groupKey === "aging") {
					c.beginPath();
					const color = lineColor(age ?? 0);
					if (isEq) c.fillStyle = color;
					else c.strokeStyle = color;
				}
				if (isEq) {
					c.moveTo(start.x + LINE_RADIUS, start.y);
					c.arc(end.x, end.y, LINE_RADIUS, 0, 2 * Math.PI);
					if (groupKey === "aging") c.fill();
				} else {
					let realEnd = age === null ? addVec(end, { x: 0, y: -10 }) : end;
					if (age === null && isVecEq(realEnd, start)) {
						realEnd = addVec(end, { x: 0.1, y: 0 });
					}
					c.moveTo(start.x, start.y);
					c.lineTo(realEnd.x, realEnd.y);
					if (groupKey === "aging") c.stroke(); // 🍆
				}
			}
			if (groupKey === "aged-dot" || groupKey === "fresh-dot") {
				c.fill();
			}
			if (groupKey === "aged" || groupKey === "fresh") {
				c.stroke();
			}
		}
		c.restore();
	}

	spawnParticles(particle: Particle): void {
		for (let i = 0; i < particle.count; i++) this.particles.push(new ClientParticle(particle));
	}
}
