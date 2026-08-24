/**
 * Inspired by https://www.charlespetzold.com/blog/2024/09/CubeWireFrame.js
 * and https://www.charlespetzold.com/blog/2024/09/Die3D.js
 */

import { Canvas } from "../canvas";
import { RenderableObject } from "../render";
import { Vec3, vec3, vec3ToDomPoint, DomPointToVec3, cross_product, subVec3 } from "@common";


export const identity = new DOMMatrix();

// I can already feel the weight of my sins crawlling on my back for this one for introducting
// a method to handle 3d shapes in our 2d game engine

// Its gonna be great for D20s Trust
interface Renderable3DObject extends RenderableObject {
    vertrices: Vec3[];
    faces: number[][]; //triangle faces
    //unspoken rule of faces: the vertex at index 0, connects to index 1 and -1
    
}

class Texture3D {
    constructor () {

    }


}


export class Cube implements Renderable3DObject {
    index = 20;
    vertrices: Vec3[];
    faces:  number[][];

    rotateX: number = 30;
    rotateY: number = 45;
    rotateZ: number = 0;
    
    constructor() {
        this.vertrices = [
            vec3(0, 0 ,0), // 0
            vec3(1, 0 ,0), // 1
            vec3(1, 1 ,0), // 2
            vec3(0, 1 ,0), // 3
            vec3(0, 0 ,1), // 4
            vec3(1, 0 ,1), // 5
            vec3(1, 1 ,1), // 6
            vec3(0, 1 ,1), // 7
        ]
        this.faces = [
            [0, 1, 2, 3], //face 1
            // [3, 0, 2],

            [0, 3, 7, 4], //face 2
            // [0, 7, 3],
            
            [0, 4, 5, 1], //face 3
            // [4, 1, 0],

            [7, 6, 5, 4], //face 4
            // [5, 7, 6],

            [1, 5, 6, 2], //face 5
            // [2, 1, 6],

            [3, 2, 6, 7], //face 5
            // [7, 2, 6],
        ]
    }




    render({c}: Canvas): void {
        const matrix = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        matrix.rotateSelf(this.rotateX, this.rotateY, this.rotateZ)
        matrix.scaleSelf(100, 100, 100)
        // this.rotateX--;
        // this.rotateY++;
        // this.rotateZ--;


        //TEMP

        c.beginPath();
        let frist = true
        for (const face of this.faces){
            const face_veterices: Vec3[] = []
            for (const vertexIdx of face) {
                const vertex = this.vertrices.at(vertexIdx)
               
                if (vertex == null) {
                    continue
                }

                face_veterices.push(DomPointToVec3(matrix.transformPoint(vec3ToDomPoint(vertex))))
            }

            //If the normal of the face is pointing in positive z, then the object is facing the user
            // otherwise, we cull it
            const last_vec = face_veterices.at(-1)
            if (last_vec == null) {
                throw new Error("How the fuck did you make a face without a single vertex"); 
            } 
            
            const normal = cross_product(
                subVec3(face_veterices[2], face_veterices[1]),
                subVec3(face_veterices[0], face_veterices[1])
            )

           
           
            if (normal.z < 0) {
                continue
            }


            c.save()

            const e = face_veterices[0].x;
            const f = face_veterices[0].y; 
            const a = (face_veterices[1].x - e)
            const b = (face_veterices[1].y - f) ;
            const c_ = (face_veterices[3].x - e);
            const d = (face_veterices[3].y - f) ;

            const textureMatrix = new DOMMatrix([ a, b, c_, d, e, f ])

            // c.fillRect("red")
            c.setTransform(c.getTransform().multiply(textureMatrix));
            c.fillStyle = "red";
            c.fillRect(0, 0, 1, 1) //TODO generalize the width heigh
            
            c.setTransform(identity)
            c.restore()

            
            // console.log(face, normal)

            for (const drawn_vertex of face_veterices) {
                if (frist) {
                    frist = false
                    c.moveTo(drawn_vertex.x, drawn_vertex.y)
                } else {
                    c.lineTo(drawn_vertex.x, drawn_vertex.y);  
                }
            }
            c.closePath();
            c.stroke();
            
            frist = true
           
        }
        // c.restore()
    }
    
}

// class DiceD20 implements Renderable3DObject {
//     index = 20;
//     vertrices: Vec3[];
//     edges:  Vec3[];
//     constructor() {

//     }

//     render(canvas: Canvas): void {
//     }
// }