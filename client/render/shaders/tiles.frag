// https://webglfundamentals.org/webgl/lessons/webgl-qna-webgl-2d-tilemaps.html

precision mediump float;

#define TILE_SIZE set_by_gl

varying vec2 v_position;

uniform mat4 u_view_inv;

void main() {
  vec2 tile_position = (u_view_inv * vec4(v_position, 0.0, 1.0)).xy / float(TILE_SIZE);



  gl_FragColor = vec4(fract(tile_position), 0.5, 1.0);
}
