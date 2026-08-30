// https://webglfundamentals.org/webgl/lessons/webgl-qna-webgl-2d-tilemaps.html

precision mediump float;

varying vec2 v_position;

// tiles.frag doesn't use the typical view matrix because
// 1. tiles are not rasterized, so we need the inverse matrix
// 2. to keep floats small, tile_position is ultimately a texcoord into the tile map (i.e. between 0 and 1)
uniform mat4 u_view_inv;
uniform sampler2D u_tilemap;

void main() {
  vec2 tile_position = (u_view_inv * vec4(v_position, 0.0, 1.0)).xy;



  gl_FragColor = vec4(fract(tile_position), 0.5, 1.0);
}
