class Game {
  render;
}

/**
 * I'm the renderer
 * I'm the one who renders
 * This function runs once every ~20ms but it can run as fast
 * as you want it to! It should be fine to call this as often
 * as you want and the gameplay should be unaffected.
 *
 */
async function render() {
  c.fillStyle = "rgba(255, 0, 0, 0.01)";
  c.fillRect(0, 0, window.innerWidth, window.innerHeight);

  c.fillStyle = "black";
  c.fillText("fuck you", 50, 50);

  requestAnimationFrame(render);
}
