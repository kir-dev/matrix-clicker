#version 300 es
precision highp float;

layout(location = 0) in vec2 inPosition;
uniform mat4 transform;

out vec2 pos;

void main() {
    pos = inPosition;
    gl_Position = transform * vec4(inPosition, 0.0, 1.0);
}
//--
#version 300 es
precision highp float;

out vec4 outColor;
in vec2 pos;
uniform vec4 color;
uniform float opacity;

void main() {
    vec3 col = mix(color.rgb, pos.xyy, 0.35);
    outColor = vec4(col, smoothstep(0.0, 1.0, opacity));
}
