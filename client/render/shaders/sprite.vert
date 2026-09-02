#version 300 es
// Copied from https://github.com/Subset-UCSD/cave-game/blob/main/client/render/shaders/gltf.vert


// Per vertex
in vec2 a_position;
out vec2 v_position;

uniform mat4 u_view;

void main() {
    gl_Position = u_view * vec4(a_position, 0, 1);
    v_position = a_position / 60.0 + vec2(0.5);
    // v_position = (u_view * vec4(a_position, 0, 1)).xy;
}
