"use client";
// Adapted from React Bits / MoltenMetal, commit 2ec034e. See LICENSE.md and PROVENANCE.md.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
type MoltenMetalColorMode = 'molten' | 'ember' | 'frost';
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const colorModeToFloat = (mode: MoltenMetalColorMode): number => (mode === 'ember' ? 1 : mode === 'frost' ? 2 : 0);

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDetail;
uniform float uGlow;
uniform float uCoreSize;
uniform float uSwirl;
uniform float uFold;
uniform float uBlackPoint;
uniform float uBrightness;
uniform float uColorMode;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform bool uEnableMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uBackgroundColor;
uniform bool uLightMode;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float time = iTime * uSpeed;
  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

  vec2 drift = vec2(0.0);
  if (uEnableMouse) {
    drift = (uMouse - 0.5) * uMouseStrength * 2.0;
  }
  p += drift;

  vec2 i = p;
  float c = 0.0;
  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
  float d = length(p);
  float rot = d + time + p.x * uSwirl;

  float cosRot = cos(rot);
  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
  float glowCore = uGlow * uCoreSize;

  for (float n = 0.0; n < 8.0; n++) {
    if (n >= uDetail) break;
    p *= warp;
    float t = r - time / (n + 3.0);
    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
  }

  c /= 6.0;

  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;

  float g = clamp(intensity, 0.0, 1.0);

  float mid = 0.5;
  if (uColorMode > 1.5) {
    mid = 0.65;
  } else if (uColorMode > 0.5) {
    mid = 0.35;
  }

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
  col = mix(col, uColor3, smoothstep(mid, 1.0, g));

  float a = g;
  if (uGrain > 0.5) {
    float gr = hash(gl_FragCoord.xy + iTime);
    a += (gr - 0.5) * uGrainIntensity;
  }
  a = clamp(a, 0.0, 1.0) * uOpacity;
  if (uLightMode) {
    float signal = 1.0 - exp(-max(c, 0.0) * 6.5);
    float body = smoothstep(0.075, 0.68, signal);
    float ridge = smoothstep(0.42, 0.92, signal);

    vec3 lightCol = mix(uColor1, uColor2, smoothstep(0.08, 0.52, signal));
    lightCol = mix(lightCol, uColor3, smoothstep(0.52, 0.96, signal));
    lightCol = mix(lightCol, lightCol * 0.72, ridge * 0.24);

    float coverage = body * mix(0.2, 0.86, signal) * uOpacity;
    if (uGrain > 0.5) {
      float gr = hash(gl_FragCoord.xy + iTime);
      coverage += (gr - 0.5) * uGrainIntensity * body * 0.16;
    }
    fragColor = vec4(mix(uBackgroundColor, lightCol, clamp(coverage, 0.0, 0.92)), 1.0);
  } else {
    fragColor = vec4(col * a, a);
  }
}
`;


export default function MoltenMetal({ paused = false }: { paused?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const refreshRef = useRef<() => void>(() => {});
  useEffect(() => { pausedRef.current = paused; refreshRef.current(); }, [paused]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    let dispose = () => {};
    try {
      const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true,
        antialias: false, dpr: Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.25 : 2) });
      const gl = renderer.gl;
      if (!(gl instanceof WebGL2RenderingContext)) throw new Error("WebGL 2 unavailable");
      const canvas = gl.canvas;
      canvas.style.cssText = "width:100%;height:100%;display:block;opacity:0";
      canvas.setAttribute("aria-hidden", "true");
      const geometry = new Triangle(gl);
      const uniforms = {
        iTime:{value:0}, iResolution:{value:new Float32Array([1,1])},
        uSpeed:{value:0.15}, uScale:{value:3.2}, uDetail:{value:3},
        uGlow:{value:1.6}, uCoreSize:{value:0.1}, uSwirl:{value:1},
        uFold:{value:-0.2}, uBlackPoint:{value:0.05}, uBrightness:{value:1.3},
        uColorMode:{value:colorModeToFloat("molten")}, uGrain:{value:0},
        uGrainIntensity:{value:0}, uOpacity:{value:0.2},
        uMouse:{value:new Float32Array([0.5,0.5])}, uMouseStrength:{value:0},
        uEnableMouse:{value:false}, uLightMode:{value:true},
        uColor1:{value:hexToRgb("#9ABEEB")}, uColor2:{value:hexToRgb("#D8E9FC")},
        uColor3:{value:hexToRgb("#FFFFFF")}, uBackgroundColor:{value:hexToRgb("#FFFFFF")}
      };
      const program = new Program(gl,{vertex,fragment,uniforms});
      const mesh = new Mesh(gl,{geometry,program});
      let raf=0, visible=true, failed=false, previous=0, elapsed=0, lastPaint=0;
      const stop=()=>{ cancelAnimationFrame(raf); raf=0; previous=0; };
      const allowed=()=>visible&&!document.hidden&&!pausedRef.current&&!reduced.matches&&!failed;
      const paint=()=>{ renderer.render({scene:mesh}); };
      const loop=(time:number)=>{
        raf=0;
        if(!allowed()) return;
        if(previous) elapsed+=Math.min(time-previous,100);
        previous=time;
        if(time-lastPaint>=1000/30) {
          uniforms.iTime.value=elapsed/1000; paint(); lastPaint=time;
        }
        raf=requestAnimationFrame(loop);
      };
      const refresh=()=>{ if(allowed()) { if(!raf) raf=requestAnimationFrame(loop); } else stop(); };
      refreshRef.current=refresh;
      const resize=()=>{
        if(failed) return;
        const rect=container.getBoundingClientRect();
        renderer.setSize(Math.max(1,Math.round(rect.width)),Math.max(1,Math.round(rect.height)));
        uniforms.iResolution.value.set([gl.drawingBufferWidth,gl.drawingBufferHeight]);
        paint();
      };
      const lost=(event:Event)=>{event.preventDefault();failed=true;stop();canvas.style.opacity="0";container.dataset.state="fallback";};
      const ro=new ResizeObserver(resize);
      const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;refresh();});
      dispose=()=>{
        stop();ro.disconnect();io.disconnect();reduced.removeEventListener("change",refresh);
        document.removeEventListener("visibilitychange",refresh);
        canvas.removeEventListener("webglcontextlost",lost);
        refreshRef.current=()=>{};
        geometry.remove();program.remove();canvas.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
      container.appendChild(canvas);
      resize();
      if(!gl.getProgramParameter(program.program,gl.LINK_STATUS)) throw new Error("Shader unavailable");
      canvas.style.opacity="1";
      container.dataset.state="ready";
      canvas.addEventListener("webglcontextlost",lost);
      ro.observe(container);io.observe(container);
      reduced.addEventListener("change",refresh);
      document.addEventListener("visibilitychange",refresh);
      refresh();
    } catch { dispose(); container.dataset.state="fallback"; }
    return ()=>dispose();
  },[]);
  return <div ref={containerRef} data-react-bits="MoltenMetal" aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none"}} />;
}
