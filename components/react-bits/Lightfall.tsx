"use client";
// React Bits Lightfall, revision 9481af7. See PROVENANCE.md and LICENSE.md.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
type RGB = [number, number, number];

const MAX_COLORS = 8;

const hexToRGB = (hex: string): RGB => {
  const c = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return [r, g, b];
};

const prepColors = (input?: string[]) => {
  const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
  const count = base.length;
  const arr: RGB[] = [];
  for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
  const avg: RGB = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    avg[0] += arr[i][0];
    avg[1] += arr[i][1];
    avg[2] += arr[i][2];
  }
  avg[0] /= count;
  avg[1] /= count;
  avg[2] /= count;
  return { arr, count, avg };
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uBgColor;
uniform vec3  uMouseColor;
uniform float uSpeed;
uniform int   uStreakCount;
uniform float uStreakWidth;
uniform float uStreakLength;
uniform float uGlow;
uniform float uDensity;
uniform float uTwinkle;
uniform float uZoom;
uniform float uBgGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uLightMode;

varying vec2 vUv;

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

vec3 tanhv(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x;
  float z = 0.0;
  float d = 1e3;
  vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) {
    if (d <= 1e-4) break;
    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }
  return vec2(O.x, atan(O.z, O.y));
}

void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy;
  vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

  vec2 c0 = sceneC(C, r);
  vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
  vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0;
  vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
  dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy);
  C = c0;

  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = uLightMode > 0.5
    ? vec4(0.0)
    : vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mN = (iMouse + iMouse - r) / r.x;
    float md = length(uv0 - mN);
    mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
    O.rgb += uMouseColor * mGlow * 0.25;
  }

  float zr = 5e-4 * uStreakWidth;
  vec2 rr = vec2(max(length(fw), 1e-5));
  float tail = 19.0 / max(uStreakLength, 0.05);

  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
    Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic);
    vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
    weight *= (1.0 + mGlow * 2.0);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
    C.x += Y.x / 8.0;
  }

  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
if (uLightMode > 0.5) {
  float peak = max(colr.r, max(colr.g, colr.b));
  float coverage = smoothstep(0.035, 0.58, peak) * uOpacity;
  vec3 chroma = clamp(colr / max(peak, 1e-4), 0.0, 1.0);
  chroma = pow(chroma, vec3(1.35));
  float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));
  chroma /= max(chromaPeak, 1e-4);
  o = vec4(mix(vec3(1.0), chroma, coverage * 0.94), 1.0);
} else {
    o = vec4(colr, uOpacity);
  }
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;


export default function Lightfall({ paused = false }: { paused?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const refreshRef = useRef<() => void>(() => {});
  useEffect(() => { pausedRef.current = paused; refreshRef.current(); }, [paused]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const cleanups: (() => void)[] = [];
    let raf = 0, visible = true, failed = false, previous = 0, elapsed = 0, lastPaint = 0;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
    try {
      const renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(devicePixelRatio || 1, 1) });
      const gl = renderer.gl;
      const canvas = gl.canvas;
      cleanups.push(() => { canvas.remove(); gl.getExtension("WEBGL_lose_context")?.loseContext(); });
      canvas.style.cssText = "width:100%;height:100%;display:block";
      canvas.setAttribute("aria-hidden", "true");
      const { arr, count, avg } = prepColors(["#2168ED", "#74AAFF", "#B6D4FF"]);
      const uniforms = {
        iResolution: { value: [1, 1, 1] }, iMouse: { value: [0, 0] }, iTime: { value: 0 },
        uColor0: { value: arr[0] }, uColor1: { value: arr[1] }, uColor2: { value: arr[2] },
        uColor3: { value: arr[3] }, uColor4: { value: arr[4] }, uColor5: { value: arr[5] },
        uColor6: { value: arr[6] }, uColor7: { value: arr[7] }, uColorCount: { value: count },
        uBgColor: { value: hexToRGB("#DDEBFF") }, uMouseColor: { value: avg },
        uSpeed: { value: 0.35 }, uStreakCount: { value: 2 }, uStreakWidth: { value: 1 },
        uStreakLength: { value: 1 }, uGlow: { value: 1 }, uDensity: { value: 0.6 },
        uTwinkle: { value: 0.4 }, uZoom: { value: 3 }, uBgGlow: { value: 0.25 },
        uOpacity: { value: 0.8 }, uMouseEnabled: { value: 0 }, uMouseStrength: { value: 0 },
        uMouseRadius: { value: 1 }, uLightMode: { value: 1 },
      };
      const geometry = new Triangle(gl);
      cleanups.push(() => geometry.remove());
      const program = new Program(gl, { vertex, fragment, uniforms });
      cleanups.push(() => program.remove());
      if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) throw new Error("Lightfall shader unavailable");
      const mesh = new Mesh(gl, { geometry, program });
      const fallback = () => {
        failed = true; stop(); canvas.style.display = "none"; container.dataset.state = "fallback";
      };
      const allowed = () => visible && !document.hidden && !pausedRef.current && !reduced.matches && !failed;
      const paint = () => { try { renderer.render({ scene: mesh }); } catch { fallback(); } };
      const loop = (time: number) => {
        raf = 0;
        if (!allowed()) return;
        if (previous) elapsed += Math.min(time - previous, 100);
        previous = time;
        if (time - lastPaint >= 1000 / 30) {
          uniforms.iTime.value = elapsed / 1000; paint(); lastPaint = time;
        }
        if (allowed()) raf = requestAnimationFrame(loop);
      };
      const refresh = () => {
        if (failed) return;
        container.dataset.state = allowed() ? "running" : "paused";
        if (allowed()) { if (!raf) raf = requestAnimationFrame(loop); } else stop();
      };
      refreshRef.current = refresh;
      const resize = () => {
        if (failed) return;
        const rect = container.getBoundingClientRect();
        renderer.setSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)));
        uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
        paint();
      };
      const lost = (event: Event) => { event.preventDefault(); fallback(); };
      const ro = new ResizeObserver(resize);
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });
      cleanups.push(() => {
        ro.disconnect(); io.disconnect();
        document.removeEventListener("visibilitychange", refresh);
        reduced.removeEventListener("change", refresh);
        canvas.removeEventListener("webglcontextlost", lost);
      });
      container.appendChild(canvas);
      canvas.addEventListener("webglcontextlost", lost);
      document.addEventListener("visibilitychange", refresh);
      reduced.addEventListener("change", refresh);
      ro.observe(container); io.observe(container); resize(); refresh();
    } catch {
      container.dataset.state = "fallback";
      stop();
      cleanups.splice(0).reverse().forEach(cleanup => cleanup());
    }
    return () => {
      stop(); refreshRef.current = () => {};
      cleanups.reverse().forEach(cleanup => cleanup());
    };
  }, []);
  return <div ref={containerRef} data-react-bits="Lightfall" aria-hidden="true" style={{ width: "100%", height: "100%", overflow: "hidden" }} />;
}
