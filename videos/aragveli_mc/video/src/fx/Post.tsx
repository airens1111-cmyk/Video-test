// Custom post pipeline (takes over R3F rendering): HDR scene -> god rays, bloom, anamorphic streak,
// depth of field, heat haze, chromatic aberration, ACES tone map, per-act grade, vignette, grain, letterbox.
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { Grade, GRADES, Preset } from "../config/presets";

export interface PostSettings {
  preset: Preset; grade?: Grade;
  focusDist: number; fstop: number; focalMM: number;     // depth of field (thin lens)
  letterbox: number;                                       // target image aspect (e.g. 2.39), 0 = none
  heat: number; frame: number; sunDir: THREE.Vector3;
  motion?: [number, number];                               // screen-space blur vector (whip pans)
  fade?: number;                                           // 0..1 fade to black
}

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const BRIGHT = `uniform sampler2D tIn; uniform float uThr; varying vec2 vUv;
void main(){ vec3 c = texture2D(tIn, vUv).rgb; float l = dot(c, vec3(.2126,.7152,.0722)); gl_FragColor = vec4(c * smoothstep(uThr, uThr * 1.6 + .2, l), 1.); }`;
const BLUR = `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
void main(){ vec3 s = vec3(0.); float w[7]; w[0]=.1964;w[1]=.1748;w[2]=.1216;w[3]=.0667;w[4]=.0288;w[5]=.0097;w[6]=.0026;
  s += texture2D(tIn, vUv).rgb * w[0];
  for (int i = 1; i < 7; i++){ s += texture2D(tIn, vUv + uDir * float(i)).rgb * w[i]; s += texture2D(tIn, vUv - uDir * float(i)).rgb * w[i]; }
  gl_FragColor = vec4(s, 1.); }`;
const STREAK = `uniform sampler2D tIn; uniform float uSpread; varying vec2 vUv;
void main(){ vec3 s = vec3(0.); float tot = 0.;
  for (int i = -16; i <= 16; i++){ float w = exp(-abs(float(i)) * .16); s += texture2D(tIn, vUv + vec2(float(i) * uSpread, 0.)).rgb * w; tot += w; }
  gl_FragColor = vec4(s / tot * vec3(.6,.75,1.2), 1.); }`;
const RAYS = `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uSun; uniform float uOn; varying vec2 vUv;
void main(){
  if (uOn <= 0.) { gl_FragColor = vec4(0.); return; }
  vec2 d = (uSun - vUv) / 48.; vec2 p = vUv; float decay = 1.; vec3 acc = vec3(0.);
  for (int i = 0; i < 48; i++){
    p += d; if (p.x < 0. || p.y < 0. || p.x > 1. || p.y > 1.) break;
    float sky = step(.99995, texture2D(tDepth, p).r);
    vec3 c = texture2D(tColor, p).rgb; acc += c * sky * decay; decay *= .955;
  }
  gl_FragColor = vec4(acc / 48. * uOn, 1.); }`;

const FINAL = `
uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tBloom; uniform sampler2D tStreak; uniform sampler2D tRays;
uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uAperture;
uniform float uBloom; uniform float uStreak; uniform float uExposure; uniform float uVignette; uniform float uGrain; uniform float uChroma;
uniform float uLetter; uniform float uHeat; uniform float uTime; uniform vec2 uMotion; uniform float uFade; uniform vec3 uSunCol;
uniform vec3 uLift; uniform vec3 uGamma; uniform vec3 uGain; uniform float uSat; uniform float uCon; uniform float uTemp;
varying vec2 vUv;
float lin(float z){ return uNear * uFar / (uFar - z * (uFar - uNear)); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
void main(){
  vec2 uv = vUv;
  // heat haze: rising shimmer, strongest low in frame
  if (uHeat > 0.) { float m = uHeat * smoothstep(.75, .1, uv.y); uv += vec2(sin(uv.y * 160. + uTime * 7.) , cos(uv.x * 140. + uTime * 5.)) * .0012 * m; }
  float z = lin(texture2D(tDepth, uv).r);
  // thin-lens circle of confusion (pixels)
  float coc = clamp(abs(z - uFocus) / max(z, .1) * uAperture, 0., 14.);
  vec3 col = vec3(0.); float tot = 0.;
  const int TAPS = 22;
  for (int i = 0; i < TAPS; i++){
    float a = float(i) * 2.39996; float r = sqrt(float(i) / float(TAPS));
    vec2 o = vec2(cos(a), sin(a)) * r * coc / uRes;
    o += uMotion * (float(i) / float(TAPS) - .5);
    vec2 q = uv + o;
    // chromatic aberration grows toward the edges
    vec2 ca = (q - .5) * uChroma;
    vec3 s = vec3(texture2D(tColor, q + ca).r, texture2D(tColor, q).g, texture2D(tColor, q - ca).b);
    col += s; tot += 1.;
  }
  col /= tot;
  col += texture2D(tBloom, uv).rgb * uBloom + texture2D(tStreak, uv).rgb * uStreak + texture2D(tRays, uv).rgb * uSunCol * 1.6;
  col = aces(col * uExposure);
  // grade: temperature, lift/gamma/gain, saturation, contrast
  col *= vec3(1. + uTemp * .08, 1., 1. - uTemp * .1);
  col = pow(max(col * uGain + uLift * (1. - col), 0.), 1. / uGamma);
  float l = dot(col, vec3(.2126,.7152,.0722));
  col = mix(vec3(l), col, uSat);
  col = (col - .5) * uCon + .5;
  // vignette + grain
  vec2 v = (vUv - .5) * vec2(uRes.x / uRes.y, 1.);
  col *= 1. - uVignette * smoothstep(.35, 1.05, length(v) * 1.15);
  col += (h12(vUv * uRes + uTime * 61.) - .5) * uGrain;
  col = clamp(col, 0., 1.);
  col = pow(col, vec3(1. / 2.2));
  col *= 1. - uFade;
  // letterbox to the target aspect
  if (uLetter > 0.) { float img = (uRes.x / uRes.y) / uLetter; if (abs(vUv.y - .5) * 2. > img) col = vec3(0.); }
  gl_FragColor = vec4(col, 1.);
}`;

function rt(w: number, h: number, depth = false) {
  const r = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  if (depth) { r.depthTexture = new THREE.DepthTexture(w, h); r.depthTexture.type = THREE.UnsignedIntType; }
  return r;
}

export function Post({ s }: { s: PostSettings }) {
  const { gl, scene, camera, size } = useThree();
  const W = Math.round(size.width * gl.getPixelRatio()), H = Math.round(size.height * gl.getPixelRatio());
  const P = useMemo(() => {
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const qs = new THREE.Scene(); qs.add(quad);
    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mk = (fs: string, u: Record<string, THREE.IUniform>) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
    const q = (n: number) => [Math.max(1, Math.round(W / n)), Math.max(1, Math.round(H / n))] as const;
    return {
      quad, qs, oc,
      scene: rt(W, H, true), b4a: rt(...q(4)), b4b: rt(...q(4)), b8a: rt(...q(8)), b8b: rt(...q(8)), st: rt(...q(4)), raysRT: rt(...q(2)),
      bright: mk(BRIGHT, { tIn: { value: null }, uThr: { value: 1 } }),
      blur: mk(BLUR, { tIn: { value: null }, uDir: { value: new THREE.Vector2() } }),
      streak: mk(STREAK, { tIn: { value: null }, uSpread: { value: 0.004 } }),
      raysM: mk(RAYS, { tColor: { value: null }, tDepth: { value: null }, uSun: { value: new THREE.Vector2() }, uOn: { value: 0 } }),
      final: mk(FINAL, {
        tColor: { value: null }, tDepth: { value: null }, tBloom: { value: null }, tStreak: { value: null }, tRays: { value: null },
        uRes: { value: new THREE.Vector2(W, H) }, uNear: { value: 1 }, uFar: { value: 1000 }, uFocus: { value: 100 }, uAperture: { value: 0 },
        uBloom: { value: 0.5 }, uStreak: { value: 0.3 }, uExposure: { value: 1 }, uVignette: { value: 0.5 }, uGrain: { value: 0.05 }, uChroma: { value: 0.002 },
        uLetter: { value: 0 }, uHeat: { value: 0 }, uTime: { value: 0 }, uMotion: { value: new THREE.Vector2() }, uFade: { value: 0 }, uSunCol: { value: new THREE.Color() },
        uLift: { value: new THREE.Vector3() }, uGamma: { value: new THREE.Vector3(1, 1, 1) }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1 }, uCon: { value: 1 }, uTemp: { value: 0 },
      }),
    };
  }, [W, H]);

  useFrame(() => {
    const p = s.preset, g = s.grade ?? GRADES[p.grade];
    const pass = (m: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => { P.quad.material = m; gl.setRenderTarget(target); gl.render(P.qs, P.oc); };
    gl.toneMapping = THREE.NoToneMapping;
    gl.setRenderTarget(P.scene); gl.clear(); gl.render(scene, camera);
    // bloom: bright pass at 1/4, blurred at 1/4 and 1/8
    P.bright.uniforms.tIn.value = P.scene.texture; P.bright.uniforms.uThr.value = p.bloom.threshold; pass(P.bright, P.b4a);
    const blurTo = (src: THREE.WebGLRenderTarget, tmp: THREE.WebGLRenderTarget, dst: THREE.WebGLRenderTarget, r: number) => {
      P.blur.uniforms.tIn.value = src.texture; P.blur.uniforms.uDir.value.set(r / src.width, 0); pass(P.blur, tmp);
      P.blur.uniforms.tIn.value = tmp.texture; P.blur.uniforms.uDir.value.set(0, r / src.height); pass(P.blur, dst);
    };
    // anamorphic streak from the bright pass
    P.streak.uniforms.tIn.value = P.b4a.texture; P.streak.uniforms.uSpread.value = 3.5 / P.b4a.width; pass(P.streak, P.st);
    blurTo(P.b4a, P.b4b, P.b8a, 1.4 * p.bloom.radius + 0.6);
    blurTo(P.b8a, P.b8b, P.b8a, 2.2 * p.bloom.radius + 0.8);
    // god rays toward the sun's screen position
    const sp = (camera as THREE.PerspectiveCamera).position.clone().addScaledVector(s.sunDir, 5000).project(camera);
    const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).dot(s.sunDir);
    P.raysM.uniforms.tColor.value = P.scene.texture; P.raysM.uniforms.tDepth.value = P.scene.depthTexture;
    P.raysM.uniforms.uSun.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
    P.raysM.uniforms.uOn.value = p.godRays * Math.max(0, facing) * (s.sunDir.y > -0.02 ? 1 : 0);
    pass(P.raysM, P.raysRT);
    // final composite
    const cam = camera as THREE.PerspectiveCamera;
    const f = P.final.uniforms;
    f.tColor.value = P.scene.texture; f.tDepth.value = P.scene.depthTexture; f.tBloom.value = P.b8a.texture; f.tStreak.value = P.st.texture; f.tRays.value = P.raysRT.texture;
    f.uRes.value.set(W, H); f.uNear.value = cam.near; f.uFar.value = cam.far;
    f.uFocus.value = s.focusDist;
    // aperture in pixels: CoC(px) = |z-f|/z * (focal^2 / (N * (f - focal))) / sensor * width
    const fm = s.focalMM / 1000, N = Math.max(1, s.fstop), sensor = 0.02489;
    f.uAperture.value = s.fstop > 0 ? (fm * fm / (N * Math.max(0.01, s.focusDist - fm))) / sensor * W : 0;
    f.uBloom.value = p.bloom.strength; f.uStreak.value = p.streak; f.uExposure.value = p.exposure;
    f.uVignette.value = p.vignette; f.uGrain.value = p.grain; f.uChroma.value = p.chroma * 4;
    f.uLetter.value = s.letterbox; f.uHeat.value = s.heat; f.uTime.value = s.frame / 24;
    f.uMotion.value.set(...(s.motion ?? [0, 0])); f.uFade.value = s.fade ?? 0;
    f.uSunCol.value.set(p.sun.intensity > 0 ? p.sun.color : "#000");
    f.uLift.value.set(...g.lift); f.uGamma.value.set(...g.gamma); f.uGain.value.set(...g.gain);
    f.uSat.value = g.saturation; f.uCon.value = g.contrast; f.uTemp.value = g.temperature;
    pass(P.final, null);
  }, 1);
  return null;
}
