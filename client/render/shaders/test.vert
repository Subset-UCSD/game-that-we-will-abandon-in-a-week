// Copied from https://github.com/Subset-UCSD/cave-game/blob/main/client/render/shaders/gltf.vert

// Per vertex
attribute vec3 a_position;

uniform mat4 u_view;

void main() {
  gl_Position = u_view * vec4(a_position, 1);
}
