import { RenderableObject } from "../render";
import { ShaderProgram } from "../ShaderProgram";
import spriteFragShader from "../shaders/sprite.frag";
import testVertShader from "../shaders/sprite.vert";
import type { Canvas } from "../canvas";
import type { MeatBall } from "@common/game";
import type { SerializedGameObject } from "@common";
import { loadFrames, LoadedFrames } from "../frames";
import {
	addVec,
	CHUNK_SIZE,
	type ChunkMap,
	ev,
	isVecEq,
	scaleVec,
	TILE_SIZE,
	type TileId,
	type Vec2,
	vec2,
	vecMap1,
	vecToArray,
} from "@common";

import { mat4, vec3 } from "gl-matrix";
import { Camera } from "../../camera";
// sprites = asdfasdf

// //We add all sprites to this list?
// const spriteSheetRefs = [
//     ""
// ]

// var spriteTex = document.createElement("canvas").getContext("2d");
// if (spriteTex is null) {
//     throw new Error("wtf, why did the document not create a canvas?")
// }



//TEMP
export const {
	base,
	walking,
	think,
	sleep,
	knife: [knife],
} = await loadFrames({
	base: ["./assets/sheep.png", "./assets/sheep2.png"],
	walking: ["./assets/sheep-walk1.png", "./assets/sheep-walk2.png"],
	think: ["./assets/think1.png", "./assets/think2.png"],
	sleep: ["./assets/sheep-sleep1.png", "./assets/sheep-sleep2.png"],
	knife: ["./assets/dager.png"],
} as const);
//TEMP

var spriteTex = document.createElement("canvas").getContext("2d");

const SPRITE_HEIGHT = 64
const SPRITE_WIDTH = 64

// function buildSpriteSheet(images: ImageBitmap[]): HTMLCanvasElement {
    
//     if (spriteTex === null) {
//         throw new Error("wtf, why did the document not create a canvas?")
//     }

//     spriteTex.canvas.width  = 64
//     spriteTex.canvas.height = 64;
//     spriteTex.clearRect(0, 0, spriteTex.canvas.width, spriteTex.canvas.height);
//     for (const image of images) {
//         spriteTex.drawImage(image, 0, 0)
//     }

    

//     return spriteTex.canvas;
// }

const ARRAY_BUFFER_LOCATION = 30

export class SpriteRenderer implements RenderableObject {
    index: number = 1;
    spriteSheet: ImageBitmap[]
    #texture?: { size: Vec2; texture: WebGLTexture };
    // #lastDataKey?: { tileRef: ChunkMap; dataOrigin: Vec2 };
    #canvas: Canvas;
    // #keyToTextureNum = new Map<string, number>();
    #tileTextures: WebGLTexture;
    #spriteShader: ShaderProgram;
    #frameid: number;
    private vao;
    private camera;
    
    constructor(canvas: Canvas, type: string, camera: Camera) {
        this.camera = camera
        const frames = walking //TEMP
        this.#frameid = 0

        // const keyToSpriteFrames = new Map<string, number>();
        this.spriteSheet = frames
        this.#canvas = canvas;

        const gl = this.#canvas.gl.gl;

        this.vao = gl.createVertexArray()
        

        this.#tileTextures = gl.createTexture();
        this.#canvas.gl.bindTexture(ARRAY_BUFFER_LOCATION, "2d-array", this.#tileTextures);
        
        //wtf do these do?
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        //Store the Sprite Animations

        
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY, // target
            0, // level (mip map)
            gl.RGBA8, // internalformat
            SPRITE_WIDTH, // width
            SPRITE_HEIGHT, // height
            frames.length, // depth (number of layers)
            0, // border muist be 0
            gl.RGBA, // format
            gl.UNSIGNED_BYTE, // type
            null, // srcData
        );

        // temporary canvas for resizing sprite to 64by64
        const tmpCanvas = document.createElement('canvas')
        const tc = tmpCanvas.getContext('2d')
        if (!tc) throw new Error('lijisfdgbsdgfsdkbgskdghdfg')
            tmpCanvas.width = SPRITE_WIDTH
            tmpCanvas.height = SPRITE_HEIGHT
            // tc.imageSmoothingEnabled=false
            const allData = new Uint8Array(SPRITE_WIDTH*SPRITE_HEIGHT*4*frames.length)
        for (let i =0; i < frames.length; i++) {
            tc.clearRect(0,0,SPRITE_WIDTH,SPRITE_HEIGHT)
            tc.drawImage(frames[i],0,0,SPRITE_WIDTH,SPRITE_HEIGHT)
            // allData.set( tc.getImageData(0,0,SPRITE_WIDTH,SPRITE_HEIGHT).data,SPRITE_WIDTH*SPRITE_HEIGHT*4*i)
                gl.texSubImage3D(
                    gl.TEXTURE_2D_ARRAY,
                    0,  // level            
                    0,  // x 
                    0,  // y
                    i, //z  
                    SPRITE_WIDTH,
                    SPRITE_HEIGHT, 
                    1, //depth
                    gl.RGBA,            
                    gl.UNSIGNED_BYTE,   
                    tc.getImageData(0,0,SPRITE_WIDTH,SPRITE_HEIGHT).data
                    // frames[i] 
            );
        }
        
        this.#canvas.gl.bindTexture(ARRAY_BUFFER_LOCATION, "2d-array", null);

        this.#spriteShader = new ShaderProgram(
            this.#canvas.gl,
            this.#canvas.gl.createProgram(
                this.#canvas.gl.createShader("vertex", testVertShader, "test.vert"),
                this.#canvas.gl.createShader("fragment", spriteFragShader, "sprite.frag")),
        );


        gl.bindVertexArray(this.vao);

		// PUT VERTICES IN BUFFER
		const buffer = gl.createBuffer(); // ?? expect("buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
            [-30, -30, 30, -30, 30, 30, -30, -30, 30, 30, -30, 30]), gl.STATIC_DRAW);

		//GET ATTRIBUTE IN .VERT
		const location = this.#spriteShader.attribMaybe("a_position");
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
        gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    render(canvas: Canvas) {
		const gl = canvas.gl.gl;
        this.#spriteShader.use();
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.uniform1i(this.#spriteShader.uniform("u_frame_id"), this.#frameid);
        this.#frameid = (this.#frameid + 1) % this.spriteSheet.length
        console.log(this.#frameid)
		// canvas.gl.bindTexture(0, "2d", texture);
		// 0 here is the 0 we passed into bindTexture above
		// gl.uniform1i(this.#spriteShader.uniform("u_tilemap"), 0);
        canvas.gl.bindTexture(ARRAY_BUFFER_LOCATION, "2d-array", this.#tileTextures);
        // console.log(this.#spriteShader.uniform("u_sprite_fames"))
		gl.uniform1i(this.#spriteShader.uniform("u_sprite_fames"), ARRAY_BUFFER_LOCATION);
		
        const cameraTransformation = this.camera.getTransformationMatrix()
       
        gl.uniformMatrix4fv(this.#spriteShader.uniform("u_view"), false, cameraTransformation);
		gl.bindVertexArray(this.vao);
		gl.drawArraysInstanced(
			gl.TRIANGLES,
			0, //Start index
			6, //number of vertices
			1, // number of instances
		);
		gl.bindVertexArray(null);

		// canvas.gl.bindTexture(ARRAY_BUFFER_LOCATION, "2d-array", null);
    }
    renderShadow(canvas: Canvas) {

    }

    update(gameObject: SerializedGameObject) {
        throw new Error("not implementated for ${gameObject}")
    }

    shouldRemove() {
        return false
    }
}