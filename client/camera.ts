import { mat4, vec3 } from "gl-matrix"
import { Canvas } from "./render"
import { Vec2, vec2 } from "@common"

export type CameraUpdate = {
    x?: number,
    y?: number,
    z?: number,
}

export class Camera {
    x: number = 0
    y: number = 0
    z: number = 0
    angleX: number = 0
    angleY: number = 0
    angleZ: number = 0
    // scale: number = 1
    canvas: Canvas;
    transformMatrix: mat4

    //does this make sense
    constructor (canvas: Canvas) {
        this.canvas = canvas
        this.transformMatrix = mat4.create()
    }

    update_camera(target: CameraUpdate) { 
        this.x += ((target.x? target.x: this.x * 2) - this.x) * 0.2;
        this.y += ((target.y? target.y: this.y * 2) - this.y) * 0.2;
        this.z += ((target.z? target.z: this.z * 2) - this.z) * 0.2;
    }

    updateCanvasView(){
        const { c, gl } = this.canvas;
        c.save();
        c.translate(this.canvas.width / 2, this.canvas.height / 2);
        c.scale(this.z, this.z);

        // unnessary in webgl
        // HACK align (canvas2D) camera to nearest pixel to hopefully avoid gaps in tiles
        c.translate(
            // 			-this.camera.x,
            // -this.camera.y,
            // i am not sure if this helps with
            -Math.round(this.x * (this.z * this.canvas.dpr)) / (this.z * this.canvas.dpr), // + this.canvas.width/ 2,
            -Math.round(this.y * (this.z * this.canvas.dpr)) / (this.z * this.canvas.dpr), // + this.canvas.height/ 2,
        );


    }

    createTransformationMatrix() {
        const cameraTransformation = mat4.create();
        
        // scale down [-canvas.width / 2, this.canvas.width / 2] to [-1, 1]
        // also flip webgl vertically so +Y is down to match this.canvas2d
        mat4.scale(cameraTransformation, cameraTransformation, vec3.fromValues(2 / this.canvas.width, -2 / this.canvas.height, 1));        
        // webgl and this.canvas2d have same coord system at this point

        mat4.scale(cameraTransformation, cameraTransformation, vec3.fromValues(this.z, this.z, 1));
        mat4.translate(cameraTransformation, cameraTransformation, vec3.fromValues(-this.x, -this.y, 0));

        return cameraTransformation
    }

    getNewView(shake: Vec2) {
        this.updateCanvasView()
        this.transformMatrix = this.createTransformationMatrix()
        this.transformMatrix = this.triggerScreenShake(shake, this.transformMatrix)

        console.log(this.transformMatrix)
        return mat4.clone(this.transformMatrix)
    }

    getTransformationMatrix() {
        return mat4.clone(this.transformMatrix)
    }

    //shake = vec2(Math.cos(screenShakeAngle) * screenShake, Math.sin(screenShakeAngle) * screenShake);
    triggerScreenShake(shake: Vec2, cameraTransformation: mat4) {
        const { c, gl } = this.canvas;
        c.translate(shake.x, shake.y);
        mat4.translate(cameraTransformation, cameraTransformation, vec3.fromValues(shake.x, shake.y, 0));
        return cameraTransformation
    }
}