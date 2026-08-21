import "./cryptocurrency_miner.js";

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const c = canvas.getContext("2d");

// bro is thsi AI???
// https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const arena = {
  width: canvas.width,
  height: canvas.height,
};

const player = {
  x: 100,
  y: 100,
  width: 32,
  height: 32,
  color: getRandomColor(),
};

document.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
const sheepImage = await createImageBitmap(
  await fetch("./assets/sheep.png").then((r) => r.blob()),
);

// document.addEventListener('key')

/**
 * I'm the renderer
 * I'm the one who renders
 * This function runs once every ~20ms but it can run as fast
 * as you want it to! It should be fine to call this as often
 * as you want and the gameplay should be unaffected.
 *
 * This is b/c
 */
(async function render() {
  c.fillStyle = "rgba(255, 0, 0, 0.01)";
  c.fillRect(0, 0, window.innerWidth, window.innerHeight);

  c.drawImage(sheepImage, 0, 0);
  c.fillStyle = "black";
  c.fillText("fuck you", 50, 50);

  requestAnimationFrame(render);
})();

(async function physics() {
  //
})();

let x = 0;
let y = 0;
while (true) {
  c.fillText("FUCK", 50 + x * 20, 100 + y * 20);
  x++;
  if (x > 30) {
    x = 0;
    y++;
  }
  if (y > 30) {
    y = 0;
  }

  // wait for one frame
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
}
