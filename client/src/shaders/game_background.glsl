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

in vec2 pos;
out vec4 fragColor;
uniform float time;
uniform vec3 colorTint;
uniform vec3 channelAmplitude;
uniform vec3 channelOffset;

void main() {
    float speed = 3.0;
    float scale = 3.3;
    vec2 p = pos.xy * vec2(scale / 2.0, scale);
    p.x += time / 3.0;
    p.y += time / 5.0;
    for (int i = 1; i < 10; i++) {
        p.x += 0.3 / float(i) * sin(float(i) * 2.5 * p.y + time * speed) +time / 7000.0;
        p.y += 0.3 / float(i) * cos(float(i) * 2.5 * p.x + time * speed) +time / 3000.0;
    }
    float r = cos(p.x + p.y + 1.0) * channelAmplitude.r + channelOffset.r;
    float g = sin(p.x + p.y + 1.0) * channelAmplitude.g + channelOffset.g;
    float b = (sin(p.x + p.y) + cos(p.x + p.y)) * channelAmplitude.b + channelOffset.b;
    fragColor = vec4(vec3(r, g, b) * colorTint, 1.0);
}
