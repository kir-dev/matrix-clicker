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

uniform vec4 color;
uniform float barProgress;
uniform float time;

out vec4 outColor;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y
    );
    return res * res;
}

void main() {
    float distanceFromBarTop = barProgress - pos.y - 0.5;
    vec2 noisePos = pos;
    noisePos.y -= time * 1.5;
    noisePos.x *= 15.0;
    noisePos.y *= 6.0;
    float noise = clamp(0.0, 1.0, noise(noisePos));

    if (distanceFromBarTop < 0.0 && barProgress < 0.4) discard;
    else if (distanceFromBarTop < 0.0 && !(distanceFromBarTop > -0.08 && noise > 0.5)) discard;

    vec4 noisyColor = color * 0.8 + noise * 0.2 * color;

    outColor = vec4(noisyColor.rgb, color.a);
}
