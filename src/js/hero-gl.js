// Latte-art shader in the hero cup. Loaded lazily by hero.js after first paint.
// The pointer stirs the foam (rotational advection around the pointer, decaying back to rest).
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';
import { reducedMotion } from '../lib/motion-pref.js';

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uSwirl, uRot;
uniform vec2 uMouse;
uniform vec3 uMoodA, uMoodB;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float dot2(vec2 v) { return dot(v, v); }
// Inigo Quilez heart SDF: point at origin, lobes up to y ~ 1.2.
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

// 0 = crema, 1 = milk foam. Heart crowning a rosetta of stacked leaves.
float art(vec2 p) {
  float heart = 1.0 - smoothstep(-0.01, 0.02, sdHeart((p - vec2(0.0, 0.02)) / 0.38) * 0.38);
  float t = clamp((p.y + 0.78) / 0.86, 0.0, 1.0);
  float w = 0.08 + 0.46 * pow(sin(t * 3.14159), 0.7);
  float inside = 1.0 - smoothstep(w - 0.03, w, abs(p.x));
  inside *= step(-0.78, p.y) * (1.0 - smoothstep(0.02, 0.1, p.y));
  float band = sin((p.y - 1.5 * p.x * p.x) * 44.0);
  float leaves = smoothstep(-0.25, 0.15, band - abs(p.x) / w * 0.9) * inside;
  float stem = (1.0 - smoothstep(0.008, 0.02, abs(p.x))) * step(-0.84, p.y) * step(p.y, 0.2);
  return clamp(max(heart, leaves) - stem * 0.7, 0.0, 1.0);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r0 = length(p);

  // Rigid rotation (idle + scroll), then a gentle differential idle swirl.
  vec2 q = rot(uRot) * p;
  q = rot(0.35 * sin(uTime * 0.35) * (1.0 - r0) * (1.0 - r0)) * q;

  // Stir: rotate around the pointer with a gaussian falloff, two lobes for a smeared tail.
  vec2 m = rot(uRot) * uMouse;
  vec2 d = q - m;
  float fall = exp(-dot(d, d) * 2.6);
  q = m + rot(uSwirl * fall) * d;
  d = q - m;
  q = m + rot(-0.35 * uSwirl * exp(-dot(d, d) * 0.9)) * d;
  float warp = 0.02 + 0.18 * min(abs(uSwirl), 2.0) * fall;
  q += (vec2(noise(q * 3.0 + uTime * 0.15), noise(q * 3.0 + 7.3 - uTime * 0.15)) - 0.5) * warp;

  // Crema: dark center, golden ring toward the wall, tiger mottling.
  float mott = noise(q * 9.0) * 0.6 + noise(q * 23.0) * 0.4;
  vec3 dark = vec3(0.23, 0.12, 0.06), crema = vec3(0.56, 0.33, 0.16), gold = vec3(0.72, 0.47, 0.23);
  vec3 col = mix(dark, crema, smoothstep(0.15, 0.85, r0));
  col = mix(col, gold, smoothstep(0.7, 0.93, r0) * (1.0 - smoothstep(0.93, 1.0, r0)));
  col *= 0.9 + 0.2 * mott;

  // Foam with a toasted edge.
  float f = art(q);
  vec3 foam = mix(vec3(0.85, 0.72, 0.55), vec3(0.97, 0.93, 0.85), smoothstep(0.3, 1.0, f));
  foam *= 0.96 + 0.06 * noise(q * 30.0);
  col = mix(col, foam, smoothstep(0.05, 0.6, f));

  // Wall shadow, mood-tinted light, soft highlight.
  col *= mix(1.0, 0.55, smoothstep(0.82, 1.0, r0));
  col *= mix(vec3(1.0), uMoodA, 0.16);
  col += uMoodB * 0.025;
  col += uMoodA * 0.12 * smoothstep(0.45, 0.0, length(p - vec2(-0.38, 0.42)));
  gl_FragColor = vec4(col, 1.0);
}`;

function readColor(style, name, fallback) {
  const hex = style.getPropertyValue(name).trim().replace('#', '');
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

// Returns false when WebGL is unavailable (the static SVG stays).
export function mount(cup, well) {
  const reduced = reducedMotion();
  const target = new Vec2(0, 0);
  let swirl = 0, time = 0, last = 0, raf = 0, visible = true, prev = null;
  let gl, renderer, program, canvas;

  const tint = () => {
    if (!program) return;
    const s = getComputedStyle(document.documentElement);
    program.uniforms.uMoodA.value = readColor(s, '--mood-a', [0.96, 0.85, 0.66]);
    program.uniforms.uMoodB.value = readColor(s, '--mood-b', [0.93, 0.9, 0.84]);
  };

  const size = () => {
    if (!renderer) return;
    const w = well.clientWidth, h = well.clientHeight;
    if (w && h) renderer.setSize(w, h);
  };

  const draw = () => renderer.render({ scene: mesh });

  let mesh;
  const build = () => {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const attrs = { alpha: false, antialias: false, powerPreference: 'low-power' };
    const ctx = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
    if (!ctx) return false;
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.5), webgl: ctx instanceof WebGLRenderingContext ? 1 : 2, ...attrs });
    gl = renderer.gl;
    program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        uTime: { value: 0 }, uSwirl: { value: 0 }, uRot: { value: 0 },
        uMouse: { value: new Vec2(0, 0) },
        uMoodA: { value: [1, 1, 1] }, uMoodB: { value: [1, 1, 1] }
      }
    });
    mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf); raf = 0; renderer = null;
      cup.classList.remove('is-gl');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      canvas.remove();
      if (build()) { size(); tint(); reduced ? draw() : start(); cup.classList.add('is-gl'); }
    });
    well.append(canvas);
    return true;
  };

  if (!build()) return false;
  size(); tint();

  const frame = (now) => {
    raf = 0;
    if (!renderer) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    time += dt;
    const k = dt * 60;
    swirl *= Math.pow(0.955, k);
    const u = program.uniforms;
    u.uMouse.value.lerp(target, 1 - Math.pow(0.85, k));
    u.uTime.value = time;
    u.uSwirl.value = swirl;
    u.uRot.value = time * 0.06 + window.scrollY * 0.0015;
    draw();
    start();
  };
  function start() {
    if (reduced || raf || !visible || document.hidden || !renderer) return;
    raf = requestAnimationFrame(frame);
  }
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };

  requestAnimationFrame(() => cup.classList.add('is-gl'));
  new ResizeObserver(() => { size(); if (reduced && renderer) draw(); }).observe(well);
  document.addEventListener('fc:theme-change', () => {
    // Tokens update on the same tick as the attribute; read after style recalc.
    requestAnimationFrame(() => { tint(); if (reduced && renderer) draw(); });
  });

  if (reduced) { draw(); return true; }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }).observe(cup);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // Stir: pointer position in cup space (-1..1, y up); tangential motion adds swirl.
  const toLocal = (e) => {
    const r = well.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
  };
  cup.addEventListener('pointermove', (e) => {
    const [x, y] = toLocal(e);
    target.set(x, y);
    if (prev) {
      const dx = x - prev[0], dy = y - prev[1];
      const cross = x * dy - y * dx; // stirring direction around the cup center
      const speed = Math.hypot(dx, dy);
      swirl = Math.max(-4, Math.min(4, swirl + cross * 14 + Math.sign(cross || 1) * speed * 3));
    }
    prev = [x, y];
  });
  cup.addEventListener('pointerleave', () => { prev = null; });
  cup.addEventListener('pointercancel', () => { prev = null; });

  start();
  return true;
}
