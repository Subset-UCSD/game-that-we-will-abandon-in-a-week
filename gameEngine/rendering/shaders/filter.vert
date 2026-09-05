#version 300 es

// https://github.com/ucsd-cse125-sp24/group1/blob/main/client/shaders/filter.vert

in vec2 a_position;

out vec2 v_position;
out vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_position = a_position;
  v_texcoord = (a_position + vec2(1.0, 1.0)) / 2.0;
}
