#version 300 es

// https://webglfundamentals.org/webgl/lessons/webgl-qna-webgl-2d-tilemaps.html
// https://archive.ph/74hHL

precision mediump float;
precision lowp sampler2DArray;

in vec2 v_position;
out vec4 fragColor;

// tiles.frag doesn't use the typical view matrix because
// 1. tiles are not rasterized, so we need the inverse matrix
// 2. to keep floats small, tile_position is ultimately a texcoord into the tile map (i.e. between 0 and 1)
uniform mat4 u_view_inv;
uniform vec2 data_size;
uniform sampler2D u_tilemap;
uniform sampler2DArray u_tile_textures;

void main() {
  vec2 tile_position = (u_view_inv * vec4(v_position, 0.0, 1.0)).xy;

  float tile_id = texture(u_tilemap, floor(tile_position) / data_size).r * 255.0;

  fragColor = texture(u_tile_textures, vec3(fract(tile_position), tile_id));
}
