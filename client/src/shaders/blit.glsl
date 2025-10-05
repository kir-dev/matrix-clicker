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

uniform sampler2D textureSampler;

in vec2 pos;

out vec4 color;

void main() {
    vec4 sampledColor = texture(textureSampler, pos.xy + 0.5);
    if (sampledColor.a == 0.0) discard;

    color = sampledColor;
}
