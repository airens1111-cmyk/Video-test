// Sky dome, voxel clouds, sun/moon/ambient light with a camera-following shadow box, and global shader uniforms.
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Preset } from "../config/presets";
import { U } from "./materials";

export function sunDir(elevation: number, azimuth: number) {
  const e = THREE.MathUtils.degToRad(elevation), a = THREE.MathUtils.degToRad(azimuth);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
}

const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FRAG = `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDirS; uniform vec3 uSunCol; uniform float uGlow; uniform float uStars; uniform vec3 uFogCol; uniform float uTimeS;
varying vec3 vDir;
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -1., 1.);
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0., 1.), .55));
  col = mix(col, uFogCol, smoothstep(.12, -.02, h));                      // below horizon blends into fog
  float s = max(dot(d, uSunDirS), 0.);
  col += uSunCol * (pow(s, 8.) * .35 + pow(s, 64.) * .6) * uGlow;
  col += uSunCol * smoothstep(.9994, .9997, s) * 18. * step(0., uSunDirS.y + .05);   // sun disc (HDR)
  if (uStars > 0.) {
    vec3 g = floor(d * 380.);
    float st = step(.9975, hash13(g)) * smoothstep(0., .25, h) * (.6 + .4 * sin(uTimeS * 2. + hash13(g + 1.) * 30.));
    col += vec3(st) * uStars * 2.2;
  }
  gl_FragColor = vec4(col, 1.);
}`;

export const Atmosphere: React.FC<{ preset: Preset; t: number; focus: THREE.Vector3; fogBase?: number; shadowSize?: number; cloudArea?: number; shadowRes?: number }> = ({ preset, t, focus, fogBase = 0, shadowSize = 600, cloudArea = 16000, shadowRes = 2048 }) => {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const skyMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false,
    uniforms: { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDirS: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uGlow: { value: 1 }, uStars: { value: 0 }, uFogCol: { value: new THREE.Color() }, uTimeS: { value: 0 } },
  }), []);
  const sd = sunDir(preset.sun.elevation, preset.sun.azimuth);
  const md = preset.moon ? sunDir(preset.moon.elevation, preset.moon.azimuth) : sd;

  useLayoutEffect(() => {
    const lightDir = preset.sun.intensity > 0 ? sd : md;
    U.uTime.value = t;
    U.uSunDir.value.copy(lightDir);
    U.uSunColor.value.set(preset.sun.intensity > 0 ? preset.sun.color : preset.moon?.color ?? "#000");
    U.uFogColor.value.set(preset.fog.color);
    U.uFogSunColor.value.set(preset.fog.sunColor);
    U.uFogDensity.value = preset.fog.density;
    U.uFogFalloff.value = preset.fog.falloff;
    U.uFogBase.value = fogBase + preset.fog.base;
    U.uHaze.value = preset.fog.haze;
    const wa = THREE.MathUtils.degToRad(preset.wind.dir);
    U.uWind.value.set(Math.sin(wa), -Math.cos(wa));
    U.uWindStrength.value = preset.wind.strength;
    U.uNight.value = preset.night;
    const u = skyMat.uniforms;
    u.uZenith.value.set(preset.sky.zenith); u.uHorizon.value.set(preset.sky.horizon); u.uSunDirS.value.copy(sd);
    u.uSunCol.value.set(preset.sun.color); u.uGlow.value = preset.sky.sunGlow; u.uStars.value = preset.sky.stars; u.uFogCol.value.set(preset.fog.color); u.uTimeS.value = t;
    scene.background = null;
    // sun / moon with a shadow box that follows the focus point
    for (const [ref, dir, col, inten] of [[sun, sd, preset.sun.color, preset.sun.intensity], [moon, md, preset.moon?.color ?? "#000", preset.moon?.intensity ?? 0]] as const) {
      const l = ref.current; if (!l) continue;
      l.color.set(col); l.intensity = 0.55 * inten * (dir.y > 0 ? Math.min(1, dir.y * 8 + 0.2) : 0);
      l.position.copy(focus).addScaledVector(dir, 3000);
      l.target.position.copy(focus); l.target.updateMatrixWorld();
      const cam = l.shadow.camera as THREE.OrthographicCamera;
      cam.left = -shadowSize; cam.right = shadowSize; cam.top = shadowSize; cam.bottom = -shadowSize; cam.near = 100; cam.far = 6000;
      cam.updateProjectionMatrix();
    }
    const h = hemi.current!; h.color.set(preset.ambient.sky); h.groundColor.set(preset.ambient.ground); h.intensity = 0.6 * preset.ambient.intensity;
  });

  return (
    <>
      <mesh material={skyMat} scale={30000} frustumCulled={false} renderOrder={-10}><sphereGeometry args={[1, 32, 16]} /></mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} castShadow shadow-mapSize={[shadowRes, shadowRes]} shadow-bias={-0.0006} shadow-normalBias={0.6} />
      <directionalLight ref={moon} castShadow={false} />
      <VoxelClouds preset={preset} t={t} area={cloudArea} center={focus} />
    </>
  );
};

const CLOUD_GEO = new THREE.BoxGeometry(1, 1, 1);
/** Flat block clouds from a noise field, drifting with the wind. */
const VoxelClouds: React.FC<{ preset: Preset; t: number; area: number; center: THREE.Vector3 }> = ({ preset, t, area, center }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const MAX = 2600;
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.92, depthWrite: false }), []);
  useLayoutEffect(() => {
    const m = ref.current!; const c = preset.clouds;
    m.material = mat; mat.color.set(c.color); mat.emissive.set(c.color).multiplyScalar(0.35 * (1 - c.dark));
    const cell = 160, n = Math.floor(area / cell);
    const wa = THREE.MathUtils.degToRad(preset.wind.dir);
    const ox = Math.sin(wa) * c.speed * t * 3, oz = -Math.cos(wa) * c.speed * t * 3;
    const tmp = new THREE.Matrix4(); let k = 0;
    const hash = (i: number, j: number) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
    const noise = (x: number, z: number) => {
      const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
      const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
      return (hash(xi, zi) * (1 - u) + hash(xi + 1, zi) * u) * (1 - v) + (hash(xi, zi + 1) * (1 - u) + hash(xi + 1, zi + 1) * u) * v;
    };
    const bx = Math.floor((center.x - area / 2) / cell), bz = Math.floor((center.z - area / 2) / cell);
    for (let i = 0; i < n && k < MAX; i++) for (let j = 0; j < n && k < MAX; j++) {
      const wx = (bx + j) * cell, wz = (bz + i) * cell;
      const v = noise((wx - ox) / 1400, (wz - oz) / 1400) * 0.7 + noise((wx - ox) / 500, (wz - oz) / 500) * 0.3;
      if (v < 1 - c.cover) continue;
      const th = 1 + Math.floor((v - (1 - c.cover)) * 10);
      tmp.compose(new THREE.Vector3(wx + (ox % cell), c.altitude + th * 15, wz + (oz % cell)), new THREE.Quaternion(), new THREE.Vector3(cell, th * 30, cell));
      m.setMatrixAt(k++, tmp);
    }
    m.count = k; m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[CLOUD_GEO, mat, MAX]} frustumCulled={false} />;
};
