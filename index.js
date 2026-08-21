/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const c = canvas.getContext("2d");

document.addEventListener("resize", () => {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
})

c.fillStyle = "red";
c.fillRect(0, 0, window.innerWidth, window.innerHeight);
const image = await createImageBitmap(await fetch('./assets/sheep.png').then(r => r.blob()))
c.drawImage(image, 0, 0)


c.fillText("fuck you", 50, 50);



class MovingObject {
    constructor() {
    }
    
    movement() {
        
    }
}

// while 