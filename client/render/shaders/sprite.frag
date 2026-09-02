#version 300 es

// https://webglfundamentals.org/webgl/lessons/webgl-qna-webgl-2d-tilemaps.html
// https://archive.ph/74hHL

precision mediump float;
precision lowp sampler2DArray;

in vec2 v_position;
out vec4 fragColor;

uniform int u_frame_id;
uniform sampler2DArray u_sprite_fames;

void main() {
    //  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec3 uvl = vec3(v_position, float(u_frame_id)); 
    fragColor = texture(u_sprite_fames, uvl);
}
