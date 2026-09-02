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
    fragColor = texture(u_sprite_fames, uvl) ; // * 0.0 + vec4(uvl, 1.0);
    // it may be better/more performant to enable alpha blending or whatever for transparency rather than discarding fragments 
    // since we are doing 2D and dont need to worry about depth ordering
    // i know it's an option in webgpu but idk what the webgl equiv is
    // if (fragColor.a < 0.5) {
    //     discard;
    // }
}
