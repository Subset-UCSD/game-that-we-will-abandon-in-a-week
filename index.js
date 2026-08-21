/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const c = canvas.getContext("2d");

document.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

c.fillStyle = "red";
c.fillRect(0, 0, window.innerWidth, window.innerHeight);
const sheepImage = await createImageBitmap(
  await fetch("./assets/sheep.png").then((r) => r.blob()),
);
c.drawImage(sheepImage, 0, 0);

c.fillStyle = 'black'
c.fillText("fuck you", 50, 50);

class MovingObject {
  constructor() {}

  movement() {}
}

let i = 0
while (true) {
c.fillText("FUCK", 50 + i * 20, 100);
i++

  // wait for one frame
  await new Promise(resolve => window.requestAnimationFrame(resolve))
}
