// Shader patches shared by every world material: procedural "pixel" block textures in world space,
// exponential height fog with sun scattering, wind sway, per-instance alpha/burn. No image textures.
import * as THREE from "three";
import { BLOCK } from "./data";

/** Global uniforms, updated once per frame by <Atmosphere/>. */
export const U = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.3, 0.5, 0.2).normalize() },
  uSunColor: { value: new THREE.Color("#ffe0b0") },
  uFogColor: { value: new THREE.Color("#c9c2b0") },
  uFogSunColor: { value: new THREE.Color("#ffd8a0") },
  uFogDensity: { value: 0.0004 },
  uFogBase: { value: 0 },
  uFogFalloff: { value: 0.004 },
  uHaze: { value: 0.00006 },
  uWind: { value: new THREE.Vector2(1, 0.3) },
  uWindStrength: { value: 0.5 },
  uNight: { value: 0 },
  uPixelFade: { value: new THREE.Vector2(250, 1600) },
};

const COMMON = /* glsl */ `
uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uFogColor; uniform vec3 uFogSunColor;
uniform float uFogDensity; uniform float uFogBase; uniform float uFogFalloff; uniform float uHaze;
uniform vec2 uWind; uniform float uWindStrength; uniform float uNight; uniform vec2 uPixelFade;
varying vec3 vWorld; varying vec3 vNormalW;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
`;

const FOG = /* glsl */ `
{
  vec3 camToP = vWorld - cameraPosition;
  float dist = length(camToP);
  float b = uFogFalloff;
  float camH = max(cameraPosition.y - uFogBase, 0.0);
  float dy = camToP.y;
  float hf = abs(b * dy) > 1e-3 ? (1.0 - exp(-b * dy)) / (b * dy) : 1.0;
  float f = uFogDensity * exp(-b * camH) * hf * dist + uHaze * dist;
  float fogAmt = 1.0 - exp(-f);
  float sunAmt = pow(max(dot(normalize(camToP), uSunDir), 0.0), 6.0);
  vec3 fogCol = mix(uFogColor, uFogSunColor, sunAmt);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, clamp(fogAmt, 0.0, 1.0));
}
`;

const WORLD_VERT = /* glsl */ `
{
  vec4 wp = vec4(transformed, 1.0);
  vec3 nW = normal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp; nW = mat3(instanceMatrix) * nW;
  #endif
  wp = modelMatrix * wp;
  vWorld = wp.xyz; vNormalW = normalize(mat3(modelMatrix) * nW);
}
`;

// ------------------------------------------------------------------ terrain block palette
const TERRAIN_FRAG = /* glsl */ `
vec3 grassDry(vec2 cell, float n){ return mix(vec3(.70,.60,.32), vec3(.62,.57,.30), hash12(cell)) * (.82 + .3 * n); }
vec3 topColor(float t, vec2 cell, vec2 pix, float n, vec3 w){
  if (t < 0.5) { vec3 c = grassDry(cell, n); if (n > .93) c = vec3(.45,.52,.25); return c; }                      // dry golden grass
  if (t < 1.5) return mix(vec3(.55,.56,.30), vec3(.70,.62,.34), hash12(cell * .37)) * (.82 + .3 * n);            // pasture
  if (t < 2.5) {                                                                                                  // farmland parcels
    vec2 pid = floor(w.xz / vec2(45., 70.)); float s = hash12(pid + 3.1);
    bool alongX = hash12(pid + 9.7) > .5; float row = fract((alongX ? w.x : w.z) / 1.6);
    if (s < .45) return mix(vec3(.80,.70,.42), vec3(.66,.57,.33), step(.55, row)) * (.86 + .2 * n);           // stubble
    if (s < .72) return mix(vec3(.46,.33,.22), vec3(.36,.26,.17), step(.5, row)) * (.86 + .2 * n);            // ploughed
    if (s < .86) return mix(vec3(.52,.50,.28), vec3(.62,.55,.30), n);                                           // fallow
    return vec3(.70,.62,.36) * (.85 + .25 * n);
  }
  if (t < 4.5) {                                                                                                  // vineyard rows
    vec2 pid = floor(w.xz / vec2(40., 55.)); bool alongX = hash12(pid + 1.3) > .5;
    float row = fract((alongX ? w.z : w.x) / 2.5);
    vec3 leaf = mix(vec3(.36,.46,.20), vec3(.62,.58,.22), step(.78, n));
    return row < .42 ? leaf * (.8 + .3 * n) : vec3(.50,.38,.25) * (.85 + .2 * n);
  }
  if (t < 5.5) return mix(vec3(.50,.55,.26), vec3(.64,.60,.32), n);                                               // orchard floor
  if (t < 6.5) { vec3 c = mix(vec3(.33,.30,.17), vec3(.45,.36,.18), n); if (n > .9) c = vec3(.72,.58,.18); return c; } // forest litter
  if (t < 7.5) { float band = .5 + .5 * sin(w.y * .9 + hash12(cell) * 2.); return mix(vec3(.62,.50,.42), vec3(.74,.64,.52), band) * (.85 + .2 * n); } // eroded clay / rock
  if (t < 8.5) return mix(vec3(.62,.60,.55), vec3(.74,.70,.62), n);                                               // gravel bank
  if (t < 9.5) { float rut = abs(fract(w.x * .35 + w.z * .35) - .5); return vec3(.66,.55,.40) * (.85 + .15 * n) * (rut < .06 ? .82 : 1.); } // dirt road
  if (t < 10.5) { vec2 c2 = floor(w.xz / .8); return mix(vec3(.55,.50,.44), vec3(.66,.60,.52), hash12(c2)) ; }   // city ground / cobbles
  if (t < 11.5) return mix(vec3(.30,.27,.22), vec3(.38,.34,.27), n);                                              // river bed
  if (t < 12.5) return vec3(.95,.96,.98) * (.92 + .08 * n);                                                       // snow
  if (t < 13.5) return mix(vec3(.50,.54,.28), vec3(.66,.60,.30), n);                                              // alpine meadow
  return mix(vec3(.52,.52,.50), vec3(.66,.65,.62), n);                                                            // scree
}
vec3 soilColor(float t, float n){
  if (t > 6.5 && t < 7.5) return mix(vec3(.60,.46,.38), vec3(.70,.58,.48), n);
  if (t > 13.5) return mix(vec3(.45,.45,.44), vec3(.56,.55,.52), n);
  return mix(vec3(.47,.35,.24), vec3(.56,.43,.30), n);
}
vec3 terrainAlbedo(float t, float topY){
  vec3 N = normalize(vNormalW);
  float distC = length(vWorld - cameraPosition);
  float fade = smoothstep(uPixelFade.x, uPixelFade.y, distC);
  vec3 col; vec2 pix; vec2 cell;
  if (N.y > .5) {
    vec2 p = vWorld.xz / ${BLOCK.toFixed(1)}; cell = floor(p); pix = floor(fract(p) * 16.);
    float n = mix(hash12(cell * 17. + pix), .5, fade);
    col = topColor(t, cell, pix, n, vWorld);
  } else {
    vec2 tang = normalize(vec2(-N.z, N.x));
    vec2 p = vec2(dot(vWorld.xz, tang), vWorld.y) / ${BLOCK.toFixed(1)}; cell = floor(p); pix = floor(fract(p) * 16.);
    float n = mix(hash12(cell * 17. + pix), .5, fade);
    float depth = topY - vWorld.y;
    float lip = ${BLOCK.toFixed(1)} * (3. + floor(hash12(vec2(cell.x * 16. + pix.x, 4.)) * 2.)) / 16.;
    if (depth < lip && t < 6.5) col = topColor(t, cell, pix, n, vWorld) * .92;
    else if (depth < ${(BLOCK * 4).toFixed(1)}) col = soilColor(t, n);
    else col = mix(vec3(.46,.45,.44), vec3(.58,.56,.53), n);
  }
  float edge = (pix.x < .5 || pix.y < .5) ? mix(.86, 1., fade) : 1.;
  return col * edge;
}
`;

function patch(mat: THREE.Material, opts: { vertexPre?: string; vertexMain?: string; fragPre?: string; albedo?: string; emissive?: string; alpha?: boolean; noFog?: boolean; wind?: number }) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = COMMON + (opts.vertexPre ?? "") + (opts.alpha ? "attribute float aAlpha; varying float vAlpha;\n" : "") + shader.vertexShader
      .replace("#include <begin_vertex>", `#include <begin_vertex>
${opts.wind ? `{
  vec3 ip = vec3(0.);
  #ifdef USE_INSTANCING
    ip = instanceMatrix[3].xyz;
  #endif
  float hgt = clamp(position.y + .5, 0., 1.);
  float ph = uTime * 1.7 + dot(ip.xz, vec2(.05, .07));
  float sway = (sin(ph) * .6 + sin(ph * 2.3 + 1.7) * .3 + .4) * uWindStrength * ${opts.wind.toFixed(3)} * hgt * hgt;
  transformed.xz += normalize(uWind + 1e-4) * sway;
}` : ""}
${opts.vertexMain ?? ""}`)
      .replace("#include <project_vertex>", "#include <project_vertex>\n" + WORLD_VERT + (opts.alpha ? "vAlpha = aAlpha;\n" : ""));
    shader.fragmentShader = COMMON + (opts.fragPre ?? "") + (opts.alpha ? "varying float vAlpha;\n" : "") + shader.fragmentShader
      .replace("#include <map_fragment>", `#include <map_fragment>\nfloat winF = 0.0;\n{\n${opts.albedo ?? ""}\n}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${opts.alpha ? "diffuseColor.a *= vAlpha;" : ""}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${opts.emissive ?? ""}`)
      .replace("#include <fog_fragment>", opts.noFog ? "" : FOG);
  };
  mat.customProgramCacheKey = () => JSON.stringify(opts).slice(0, 400);
  return mat;
}

/** Terrain quads: aType = land-use id, aTop = column top (m) for the grass lip on side faces. */
export function terrainMaterial() {
  return patch(new THREE.MeshLambertMaterial({ color: "#ffffff" }), {
    vertexPre: "attribute float aType; attribute float aTop; varying float vType; varying float vTop;\n",
    vertexMain: "vType = aType; vTop = aTop;",
    fragPre: "varying float vType; varying float vTop;\n" + TERRAIN_FRAG,
    albedo: "diffuseColor.rgb *= terrainAlbedo(vType, vTop);",
  });
}

// ------------------------------------------------------------------ object textures (houses, walls, trees)
export type ObjKind = "plaster" | "stone" | "tuff" | "roof" | "wood" | "leaves" | "trunk" | "tile";
const OBJ_FRAG: Record<ObjKind, string> = {
  plaster: `
    vec3 N = normalize(vNormalW); vec2 tang = normalize(vec2(-N.z, N.x) + 1e-4);
    vec2 q = abs(N.y) > .5 ? vWorld.xz : vec2(dot(vWorld.xz, tang), vWorld.y);
    vec2 cell = floor(q / .5); float n = hash12(cell);
    vec3 c = mix(vec3(.86,.80,.70), vec3(.78,.72,.62), n);
    float burn = vBurn;
    if (abs(N.y) < .5) {
      vec2 f = fract(q / vec2(3.2, 3.0));
      bool win = f.x > .32 && f.x < .62 && f.y > .30 && f.y < .74 && hash12(floor(q / vec2(3.2, 3.0)) + vSeed) > .25;
      bool balc = f.y < .12 && hash12(vec2(floor(q.y / 3.0), vSeed)) > .45;
      if (balc) c = mix(vec3(.45,.30,.18), vec3(.52,.36,.22), n);
      if (win) { c = vec3(.10,.08,.07); winF = 1.; }
    } else c = mix(vec3(.58,.50,.40), vec3(.66,.58,.46), n);
    c = mix(c, vec3(.10,.09,.08) * (.7 + .6 * n), burn * .85);
    diffuseColor.rgb *= c;`,
  stone: `
    vec3 N = normalize(vNormalW); vec2 tang = normalize(vec2(-N.z, N.x) + 1e-4);
    vec2 q = abs(N.y) > .5 ? vWorld.xz : vec2(dot(vWorld.xz, tang), vWorld.y);
    float course = floor(q.y / .7); vec2 brick = floor(vec2(q.x / 1.1 + course * .5, course));
    float n = hash12(brick);
    vec3 c = mix(vec3(.60,.56,.50), vec3(.72,.67,.58), n) * (fract(q.y / .7) < .1 ? .8 : 1.);
    c = mix(c, vec3(.12,.11,.10), vBurn * .7);
    diffuseColor.rgb *= c;`,
  tuff: `
    vec3 N = normalize(vNormalW); vec2 tang = normalize(vec2(-N.z, N.x) + 1e-4);
    vec2 q = abs(N.y) > .5 ? vWorld.xz : vec2(dot(vWorld.xz, tang), vWorld.y);
    float course = floor(q.y / .5); vec2 brick = floor(vec2(q.x / .9 + course * .5, course));
    float n = hash12(brick);
    vec3 c = mix(vec3(.80,.70,.52), vec3(.88,.79,.60), n) * (fract(q.y / .5) < .1 ? .86 : 1.);
    diffuseColor.rgb *= mix(c, vec3(.2,.17,.14), vBurn * .6);`,
  roof: `
    vec2 cell = floor(vWorld.xz / .5); float n = hash12(cell);
    vec3 c = mix(vec3(.50,.43,.34), vec3(.60,.52,.40), n);
    diffuseColor.rgb *= mix(c, vec3(.07,.06,.05) * (.6 + .8 * n), vBurn);`,
  tile: `
    vec3 N = normalize(vNormalW);
    vec2 q = vWorld.xz + vWorld.y; float n = hash12(floor(q / .45));
    vec3 c = mix(vec3(.62,.30,.20), vec3(.72,.38,.24), n);
    diffuseColor.rgb *= mix(c, vec3(.08,.07,.06), vBurn);`,
  wood: `
    vec2 q = vWorld.xz + vWorld.y * .3; float n = hash12(floor(q * 3.));
    diffuseColor.rgb *= mix(vec3(.42,.29,.17), vec3(.52,.37,.22), n) * (1. - .85 * vBurn);`,
  trunk: `
    float n = hash12(floor(vec2(vWorld.x + vWorld.z, vWorld.y) * 3.));
    diffuseColor.rgb *= mix(vec3(.30,.22,.15), vec3(.40,.30,.20), n);`,
  leaves: `
    vec3 q = floor(vWorld * 1.6); float n = hash13(q);
    vec3 c = vLeaf * (.75 + .4 * n);
    if (n > .9) c *= .55;
    diffuseColor.rgb *= c;`,
};

export function objectMaterial(kind: ObjKind, extra: { wind?: number } = {}) {
  const leaf = kind === "leaves";
  return patch(new THREE.MeshLambertMaterial({ color: "#ffffff" }), {
    vertexPre: "attribute float aBurn; attribute float aSeed; varying float vBurn; varying float vSeed;\n" + (leaf ? "varying vec3 vLeaf;\n" : ""),
    vertexMain: "vBurn = aBurn; vSeed = aSeed;" + (leaf ? "\n#ifdef USE_INSTANCING_COLOR\n vLeaf = instanceColor;\n#else\n vLeaf = vec3(.4,.5,.2);\n#endif" : ""),
    fragPre: "varying float vBurn; varying float vSeed;\n" + (leaf ? "varying vec3 vLeaf;\n" : ""),
    albedo: OBJ_FRAG[kind] + (leaf ? "" : ""),
    // windows of burning houses glow and flicker
    emissive: kind === "plaster" ? `if (winF > .5) totalEmissiveRadiance += vec3(3.2, 1.3, .35) * vBurn * (.6 + .4 * sin(uTime * 13. + vSeed * 40.));` : "",
    wind: extra.wind,
  });
}

/** Particles: per-instance alpha (aAlpha) and colour; additive for fire/sparks. */
export function particleMaterial(kind: "alpha" | "additive" | "lit") {
  if (kind === "additive") {
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    return patch(m, { alpha: true, noFog: false });
  }
  const m = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, depthWrite: false });
  return patch(m, { alpha: true, emissive: kind === "alpha" ? "totalEmissiveRadiance += diffuseColor.rgb * .35;" : "" });
}

/** Animated voxel water: moving pixel ripples, fresnel sky tint, sun glints (HDR -> bloom). */
export function waterMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.92 });
  return patch(m, {
    albedo: `
      vec2 p = vWorld.xz / 1.25; vec2 cell = floor(p);
      float flow = uTime * .9;
      float n1 = hash12(floor(vec2(p.x + flow * .6, p.y + flow * .25)));
      float n2 = hash12(floor(vec2(p.x * .5 - flow * .3, p.y * .5 + flow * .4)) + 7.);
      float n = (n1 * .6 + n2 * .4);
      vec3 deep = vec3(.16,.27,.30), shallow = vec3(.30,.42,.40);
      vec3 V = normalize(cameraPosition - vWorld);
      float fres = pow(1. - max(V.y, 0.), 4.);
      vec3 c = mix(deep, shallow, n) ;
      c = mix(c, uFogColor * .9, fres * .6);
      diffuseColor.rgb *= c;`,
    emissive: `{
      vec3 V = normalize(cameraPosition - vWorld); vec3 R = reflect(-V, vec3(0.,1.,0.));
      vec2 p = vWorld.xz / 1.25;
      float g = hash12(floor(vec2(p.x + uTime * .55, p.y + uTime * .22)) + 3.);
      float spec = pow(max(dot(R, uSunDir), 0.), 220.) * step(.55, g);
      totalEmissiveRadiance += uSunColor * spec * 6. * (1. - uNight);
    }`,
  });
}
