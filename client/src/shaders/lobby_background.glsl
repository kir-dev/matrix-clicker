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

#define N 9

#define rnd(p) fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453)
#define rnd2(p) fract(sin((p) * mat2(127.1, 311.7, 269.5, 183.3)) * 43758.5453)
#define srnd(p) (2.0 * rnd(p) - 1.0)
#define srnd2(p) (2.0 * rnd2(p) - 1.0)

in vec2 pos;
out vec4 O;
uniform float time;
uniform vec4 color;
uniform float opacity;

void main() {
    vec2 uv = pos * 6.0 + time * 0.125;
    float m = 1e9, m2, v, w;

    for (int k = 0; k < N * N; k++) {
        vec2 iU = floor(uv) + 0.5;
        vec2 g = iU + vec2(k % N, k / N) - 1.0;
        vec2 p = g + srnd2(g) * 0.75 - uv + 0.1 * sin(time + vec2(1.6, 0.0) + 3.14 * srnd(g));
        vec2 q = p * mat2(1.0, -1.0, 1.0, 1.0) * 0.707;

        p *= 1.5 + 1.0 * srnd(g + 0.1);
        q = p * mat2(sin(time + 3.14 * srnd(g) + 1.57 * vec4(1.0, 2.0, 0.0, 1.0)));
        p = abs(p);
        v = max(p.x, p.y);
        q = abs(q);
        w = max(q.x, q.y);
        v = max(v, w);

        if (v < m) {
            m2 = m;
            m = v;
        } else if (v < m2) {
            m2 = v;
        }
    }

    v = m2 - m;

    O = vec4(min(color.rgb / v * 1.5, vec3(1.0)) * smoothstep(0.0, 1.0, opacity), 1.0);
}
