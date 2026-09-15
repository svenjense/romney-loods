import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- catalogus
const PANEL_TYPES = {
  mycelium: { label: 'Myceliumpaneel', w: 1.2, h: 0.6, th: 0.06 },
  bamboe:   { label: 'Bamboe wandpaneel', w: 2.4, h: 1.2, th: 0.03 },
  clt:      { label: 'CLT-deel', w: 2.4, h: 1.2, th: 0.10 },
};
const FLOOR_TYPES = {
  werkbank:     { label: 'Werkbank', w: 2.0, d: 0.8, h: 0.9, color: 0x8a6d4b },
  stelling:     { label: 'Stelling', w: 2.7, d: 0.6, h: 2.2, color: 0x4a6fa5 },
  tafel:        { label: 'Tafel', w: 1.6, d: 0.8, h: 0.75, color: 0xd9c7a3 },
  pallet:       { label: 'Pallet materiaal', w: 1.2, d: 0.8, h: 1.0, color: 0xb08a5a },
  kast:         { label: 'Kast', w: 1.0, d: 0.5, h: 2.0, color: 0x7d838a },
  cltstaand:    { label: 'CLT-deel vrijstaand', w: 3.0, d: 0.12, h: 2.6, tex: 'clt' },
  bamboestaand: { label: 'Bamboepaneel vrijstaand', w: 1.2, d: 0.05, h: 2.4, tex: 'bamboe' },
  myceliumblok: { label: 'Myceliumblok', w: 0.6, d: 0.6, h: 0.6, tex: 'mycelium' },
  bus:          { label: 'Bestelbus', w: 2.0, d: 5.0, h: 2.2, color: 0xe8e8e8 },
};
const DEFAULT_PARAMS = { length: 13, width: 6, wallH: 1.0, door: 60, opacity: 100, clip: 0,
  office: true, officeW: 3.0, officeD: 3.5, officeH: 2.6, officeSide: 'links' };

function examplePreset() {
  const items = [];
  let id = 1;
  const p = (type, surface, u, v, extra = {}) => items.push({ id: id++, kind: 'panel', type, surface, u, v, w: PANEL_TYPES[type].w, h: PANEL_TYPES[type].h, ...extra });
  const f = (type, x, z, rot = 0) => items.push({ id: id++, kind: 'floor', type, x, z, rot, w: FLOOR_TYPES[type].w, d: FLOOR_TYPES[type].d, h: FLOOR_TYPES[type].h });
  // mycelium op de linkerwand (t vanaf vloer links), in een raster
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p('mycelium', 'shell', 5.2 + i * 1.3, 0.75 + j * 0.7);
  // bamboe op de rechterwand: t = totale omtrek - hoogte
  const T = 2 * 1 + Math.PI * 3;
  p('bamboe', 'shell', 5.0, T - 0.85);
  p('bamboe', 'shell', 7.6, T - 0.85);
  p('bamboe', 'shell', 10.2, T - 0.85);
  // CLT op de achterwand
  p('clt', 'back', -1.3, 0.8);
  p('clt', 'back', 1.3, 0.8);
  p('clt', 'back', 0, 2.1);
  f('cltstaand', 10.0, -0.6, 0.5);
  f('werkbank', 11.8, -2.2, 0);
  f('stelling', 11.6, 2.3, 0);
  f('tafel', 7.0, 0.6, 0);
  f('pallet', 4.2, 2.3, 0);
  return { params: { ...DEFAULT_PARAMS }, items };
}

let state = null;
let selectedId = null;
const P = () => state.params;

// ---------------------------------------------------------------- texturen
function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function noise(ctx, s, n, alpha, dark = true) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(Math.random() * 60);
    ctx.fillStyle = dark ? `rgba(0,0,0,${alpha * Math.random()})` : `rgba(255,255,255,${alpha * Math.random()})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
const TEX = {
  // golfplaat: 8 golven per tegel, tegel = 0.8 m
  corrugated: canvasTex(256, (ctx, s) => {
    for (let x = 0; x < s; x++) {
      const v = 0.5 + 0.5 * Math.sin((x / s) * Math.PI * 2 * 8);
      const g = Math.round(140 + 70 * v);
      ctx.fillStyle = `rgb(${g},${g + 3},${g + 7})`; ctx.fillRect(x, 0, 1, s);
    }
    noise(ctx, s, 800, 0.08);
  }, [1 / 0.8, 1 / 0.8]),
  mycelium: canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#e6dcc5'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(120,100,70,0.25)' : 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, 0.6 + Math.random() * 2.2, 0, 7); ctx.fill();
    }
  }, [1 / 0.6, 1 / 0.6]),
  bamboe: canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#c9a165'; ctx.fillRect(0, 0, s, s);
    const slat = 32;
    for (let x = 0; x < s; x += slat) {
      const g = ctx.createLinearGradient(x, 0, x + slat, 0);
      g.addColorStop(0, 'rgba(90,60,20,0.35)'); g.addColorStop(0.5, 'rgba(255,240,200,0.15)'); g.addColorStop(1, 'rgba(90,60,20,0.35)');
      ctx.fillStyle = g; ctx.fillRect(x, 0, slat, s);
      ctx.fillStyle = 'rgba(70,45,15,0.6)'; ctx.fillRect(x, 0, 1, s);
      const ny = (x * 3.7) % s; ctx.fillStyle = 'rgba(90,60,25,0.35)'; ctx.fillRect(x, ny, slat, 3);
    }
    noise(ctx, s, 600, 0.1);
  }, [1 / 0.4, 1 / 0.4]),
  clt: canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#d8b98a'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) {
      const a = 0.05 + 0.12 * Math.abs(Math.sin(y * 0.21) * Math.sin(y * 0.037));
      ctx.fillStyle = `rgba(110,70,30,${a})`; ctx.fillRect(0, y, s, 1);
    }
    for (let y = 0; y < s; y += 64) { ctx.fillStyle = 'rgba(90,55,20,0.45)'; ctx.fillRect(0, y, s, 2); }
    noise(ctx, s, 400, 0.08);
  }, [1 / 0.8, 1 / 0.8]),
  concrete: canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#a2a29f'; ctx.fillRect(0, 0, s, s); noise(ctx, s, 6000, 0.12); noise(ctx, s, 3000, 0.12, false);
  }, [1 / 1.5, 1 / 1.5]),
  grass: canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#7d9a5a'; ctx.fillRect(0, 0, s, s); noise(ctx, s, 8000, 0.18); noise(ctx, s, 3000, 0.1, false);
  }, [1 / 2, 1 / 2]),
  plaster: canvasTex(128, (ctx, s) => { ctx.fillStyle = '#f2efe6'; ctx.fillRect(0, 0, s, s); noise(ctx, s, 800, 0.05); }, [1, 1]),
};
function clone(tex, rx, ry) { const t = tex.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; }

const MAT = {
  shell: new THREE.MeshStandardMaterial({ map: TEX.corrugated, side: THREE.DoubleSide, metalness: 0.45, roughness: 0.55, transparent: true }),
  gable: new THREE.MeshStandardMaterial({ map: TEX.corrugated, side: THREE.DoubleSide, metalness: 0.45, roughness: 0.55, transparent: true }),
  rib: new THREE.MeshStandardMaterial({ color: 0x3f4a55, metalness: 0.6, roughness: 0.4 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x8e979f, metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide }),
  steel: new THREE.MeshStandardMaterial({ color: 0x555d66, metalness: 0.7, roughness: 0.4 }),
  cable: new THREE.LineBasicMaterial({ color: 0x222222 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x9fc7e6, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0, side: THREE.DoubleSide }),
  frame: new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: 0x3a5a40, roughness: 0.6 }),
  plaster: new THREE.MeshStandardMaterial({ map: TEX.plaster, roughness: 0.9, side: THREE.DoubleSide }),
  officeFloor: new THREE.MeshStandardMaterial({ map: clone(TEX.clt, 1 / 1.2, 1 / 1.2), roughness: 0.7 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xc8a97e, roughness: 0.7 }),
  chair: new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.7 }),
  radiator: new THREE.MeshStandardMaterial({ color: 0xd94f3d, roughness: 0.5 }),
  concrete: new THREE.MeshStandardMaterial({ map: TEX.concrete, roughness: 0.95 }),
  grass: new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }),
  mycelium: new THREE.MeshStandardMaterial({ map: TEX.mycelium, roughness: 0.95 }),
  bamboe: new THREE.MeshStandardMaterial({ map: TEX.bamboe, roughness: 0.6 }),
  clt: new THREE.MeshStandardMaterial({ map: TEX.clt, roughness: 0.75 }),
};
const CLIP_MATS = [MAT.shell, MAT.gable, MAT.rib, MAT.plate, MAT.steel, MAT.cable, MAT.glass, MAT.frame, MAT.door, MAT.plaster, MAT.officeFloor, MAT.wood, MAT.chair, MAT.radiator];
const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1000);
CLIP_MATS.forEach(m => { m.clippingPlanes = [clipPlane]; });

// ---------------------------------------------------------------- scene
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe3f5);
scene.fog = new THREE.Fog(0xcfe3f5, 70, 160);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.01; controls.minDistance = 0.5; controls.maxDistance = 80;

scene.add(new THREE.HemisphereLight(0xffffff, 0x5a6b3a, 0.75));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.7);
sun.position.set(-10, 18, 12); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), MAT.grass);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);

const building = new THREE.Group(); scene.add(building);
const itemsGroup = new THREE.Group(); scene.add(itemsGroup);
let surfaces = { shell: null, back: null, front: null };
let door = { group: null, cables: [], anchors: [], plateH: 0, plateW: 0, angle: 0 };
let floorMesh = null;

// profiel van de doorsnede: t loopt van vloer links, over de boog, naar vloer rechts
function profile(t) {
  const h = P().wallH, R = P().width / 2, arc = Math.PI * R;
  if (t < h) return { z: -R, y: t, nz: 1, ny: 0 };
  if (t < h + arc) { const a = (t - h) / R; return { z: -R * Math.cos(a), y: h + R * Math.sin(a), nz: Math.cos(a), ny: -Math.sin(a) }; }
  const t2 = t - h - arc; return { z: R, y: h - t2, nz: -1, ny: 0 };
}
const profLen = () => 2 * P().wallH + Math.PI * P().width / 2;
const ridge = () => P().wallH + P().width / 2;
function wallTop(z) { const R = P().width / 2; return P().wallH + Math.sqrt(Math.max(0, R * R - z * z)); }

class ProfileCurve extends THREE.Curve {
  constructor(x, inset) { super(); this.x = x; this.inset = inset; }
  getPoint(u, target = new THREE.Vector3()) {
    const p = profile(u * profLen());
    return target.set(this.x, p.y + p.ny * this.inset, p.z + p.nz * this.inset);
  }
}

function textSprite(text, opts = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.roundRect(4, 4, 504, 120, 24); ctx.fill();
  ctx.fillStyle = opts.color || '#1d232a'; ctx.font = `${opts.bold ? '700' : '500'} 56px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
  const w = opts.width || 1.6; s.scale.set(w, w / 4, 1);
  return s;
}

function disposeGroup(g) {
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  while (g.children.length) g.remove(g.children[0]);
}

function gableShape(holes) {
  const R = P().width / 2, h = P().wallH;
  const s = new THREE.Shape();
  s.moveTo(-R, 0); s.lineTo(-R, h); s.absarc(0, h, R, Math.PI, 0, true); s.lineTo(R, 0); s.closePath();
  for (const [z0, y0, w, hh] of holes) {
    const p = new THREE.Path(); p.moveTo(z0, y0); p.lineTo(z0 + w, y0); p.lineTo(z0 + w, y0 + hh); p.lineTo(z0, y0 + hh); p.closePath();
    s.holes.push(p);
  }
  return s;
}

function buildBuilding() {
  disposeGroup(building);
  const L = P().length, W = P().width, R = W / 2, h = P().wallH, T = profLen();

  // vloer + stoep
  floorMesh = new THREE.Mesh(new THREE.BoxGeometry(L, 0.12, W), MAT.concrete);
  floorMesh.position.set(L / 2, -0.06, 0); floorMesh.receiveShadow = true; building.add(floorMesh);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, W + 2), MAT.concrete);
  apron.position.set(-2, -0.07, 0); apron.receiveShadow = true; building.add(apron);

  // schaal (golfplaat over de boog)
  const nx = Math.max(8, Math.round(L * 2)), nt = 80;
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nt; j++) {
    const x = (L * i) / nx, t = (T * j) / nt, p = profile(t);
    pos.push(x, p.y, p.z); nor.push(0, -p.ny, -p.nz); uv.push(x, t);
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) {
    const a = i * (nt + 1) + j, b = a + nt + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  sg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx);
  const shell = new THREE.Mesh(sg, MAT.shell); shell.castShadow = true; shell.receiveShadow = true; shell.name = 'shell';
  building.add(shell); surfaces.shell = shell;

  // spanten
  const nRib = Math.max(2, Math.round(L / 1.5));
  for (let i = 0; i <= nRib; i++) {
    const x = 0.12 + (i * (L - 0.24)) / nRib;
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new ProfileCurve(x, 0.07), 64, 0.04, 8, false), MAT.rib);
    building.add(rib);
  }
  // gordingen
  for (let k = 1; k < 8; k++) {
    const p = profile((T * k) / 8);
    const g = new THREE.Mesh(new THREE.BoxGeometry(L - 0.2, 0.05, 0.05), MAT.rib);
    g.position.set(L / 2, p.y + p.ny * 0.1, p.z + p.nz * 0.1); building.add(g);
  }

  // voorgevel met ramen + deur (achter de takelplaat)
  const holes = [];
  const off = P().office;
  const oW = Math.min(P().officeW, W - 1.2);
  const side = P().officeSide === 'links' ? -1 : 1;
  const oz0 = side < 0 ? -R : R - oW, oz1 = oz0 + oW; // kantoor z-bereik
  const rz0 = side < 0 ? oz1 : -R, rz1 = side < 0 ? R : oz0; // rest van de gevel
  if (off) {
    const wz0 = oz0 + 0.35, ww = oW - 0.7, top = Math.min(2.25, wallTop(Math.abs(wz0) > Math.abs(wz0 + ww) ? wz0 : wz0 + ww) - 0.2);
    holes.push([wz0, 0.9, ww, Math.max(0.6, top - 0.9)]);
  }
  const doorZ = side < 0 ? rz0 + 0.35 : rz1 - 1.35;
  holes.push([doorZ, 0.02, 1.0, 2.1]);
  const remZ0 = side < 0 ? doorZ + 1.35 : rz0 + 0.35, remZ1 = side < 0 ? rz1 - 0.35 : doorZ - 0.35;
  if (remZ1 - remZ0 > 1.0) {
    const ww = Math.min(2.0, remZ1 - remZ0), wz0 = (remZ0 + remZ1) / 2 - ww / 2;
    const edge = Math.abs(wz0) > Math.abs(wz0 + ww) ? wz0 : wz0 + ww;
    const top = Math.min(2.25, wallTop(edge) - 0.2);
    if (top - 0.9 > 0.5) holes.push([wz0, 0.9, ww, top - 0.9]);
  }
  const front = new THREE.Mesh(new THREE.ShapeGeometry(gableShape(holes), 24), MAT.gable);
  front.rotation.y = -Math.PI / 2; front.castShadow = true; front.name = 'front'; building.add(front); surfaces.front = front;
  for (const [z0, y0, w, hh] of holes) {
    if (hh > 2) { // deur
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.06, hh, w), MAT.door); d.position.set(0, y0 + hh / 2, z0 + w / 2); building.add(d);
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.35), MAT.glass); g.position.set(0, 1.6, z0 + w / 2); building.add(g);
    } else {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.03, hh, w), MAT.glass); g.position.set(0, y0 + hh / 2, z0 + w / 2); building.add(g);
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, hh + 0.08, w + 0.08), MAT.frame); f.position.copy(g.position);
      building.add(new THREE.LineSegments(new THREE.EdgesGeometry(f.geometry), MAT.cable)).position.copy(g.position);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, hh, 0.04), MAT.frame); bar.position.copy(g.position); building.add(bar);
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, w), MAT.frame); bar2.position.copy(g.position); building.add(bar2);
    }
  }

  // achtergevel
  const back = new THREE.Mesh(new THREE.ShapeGeometry(gableShape([]), 24), MAT.gable);
  back.rotation.y = -Math.PI / 2; back.position.x = L; back.castShadow = true; back.name = 'back'; building.add(back); surfaces.back = back;

  // takelplaat
  const plateTop = Math.min(h + 1.7, ridge() - 0.35);
  const plateH = plateTop;
  const plateW = 2 * Math.sqrt(Math.max(0.5, R * R - Math.max(0, plateTop - h) ** 2)) - 0.1;
  const pg = new THREE.Group(); pg.position.set(-0.07, plateTop, 0);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.04, plateH, plateW), MAT.plate);
  plate.position.set(0, -plateH / 2, 0); plate.castShadow = true; pg.add(plate);
  for (const yy of [-plateH * 0.3, -plateH * 0.7]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, plateW - 0.1), MAT.steel); st.position.set(-0.05, yy, 0); pg.add(st);
  }
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, plateW + 0.2, 12), MAT.steel);
  hinge.rotation.x = Math.PI / 2; pg.add(hinge);
  building.add(pg);
  // galg + kabels
  const anchors = [];
  for (const s of [-1, 1]) {
    const zc = s * (plateW / 2 - 0.2);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), MAT.steel);
    beam.position.set(-0.45, ridge() + 0.2, zc); building.add(beam);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.1), MAT.steel);
    strut.position.set(-0.7, ridge() - 0.35, zc); strut.rotation.z = Math.PI / 4; strut.rotation.y = Math.PI / 2; building.add(strut);
    anchors.push(new THREE.Vector3(-1.05, ridge() + 0.14, zc));
  }
  const cables = anchors.map(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const l = new THREE.Line(g, MAT.cable); building.add(l); return l;
  });
  const winch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.4), MAT.steel);
  winch.position.set(0.25, 1.4, side < 0 ? R - 0.3 : -R + 0.3); building.add(winch);
  door = { group: pg, cables, anchors, plateH, plateW, angle: door.angle };
  updateDoor(true);

  // kantoor
  if (off) buildOffice(oz0, oz1, side);

  // maatlabels
  const l1 = textSprite(`${L} m`, { width: 1.4 }); l1.position.set(L / 2, 0.35, R + 1.0); building.add(l1);
  const l2 = textSprite(`${W} m`, { width: 1.4 }); l2.position.set(L + 1.0, 0.35, 0); building.add(l2);

  applyOpacity(); applyClip();
}

function buildOffice(z0, z1, side) {
  const D = Math.min(P().officeD, P().length - 1), H = Math.min(P().officeH, ridge() - 0.3), W = z1 - z0, zc = (z0 + z1) / 2;
  const g = new THREE.Group(); building.add(g);
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const zIn = side < 0 ? z1 : z0;            // wand naar de hal
  const zOut = side < 0 ? z0 : z1;           // buitenwand (loodswand)
  // vloer + plafond
  box(D, 0.03, W, MAT.officeFloor, D / 2, 0.015, zc);
  box(D + 0.12, 0.22, W, MAT.plaster, D / 2 + 0.06, H + 0.11, zc);
  // zijwand naar de hal: onder dicht, glasstrook, boven dicht
  box(D, 0.9, 0.12, MAT.plaster, D / 2, 0.45, zIn);
  box(D, 1.3, 0.03, MAT.glass, D / 2, 1.55, zIn);
  box(D, Math.max(0.05, H - 2.2), 0.12, MAT.plaster, D / 2, 2.2 + (H - 2.2) / 2, zIn);
  box(D, 0.05, 0.14, MAT.frame, D / 2, 0.9, zIn); box(D, 0.05, 0.14, MAT.frame, D / 2, 2.2, zIn);
  // achterwand naar de hal: deur bij de buitenwand, rest glasstrook
  const dw = 0.9, dz = side < 0 ? z0 + 0.15 + dw / 2 : z1 - 0.15 - dw / 2;
  const doorM = box(0.06, 2.1, dw, MAT.door, D, 1.05, dz); doorM.rotation.y = 0;
  box(0.12, 0.1, dw + 0.3, MAT.frame, D, 2.13, dz);
  box(0.12, Math.max(0.05, H - 2.2), dw + 0.3, MAT.plaster, D, 2.2 + (H - 2.2) / 2, dz);
  const rw = W - dw - 0.3, rz = side < 0 ? z1 - rw / 2 : z0 + rw / 2;
  box(0.12, 0.9, rw, MAT.plaster, D, 0.45, rz);
  box(0.03, 1.3, rw, MAT.glass, D, 1.55, rz);
  box(0.12, Math.max(0.05, H - 2.2), rw, MAT.plaster, D, 2.2 + (H - 2.2) / 2, rz);
  box(0.14, 0.05, rw, MAT.frame, D, 0.9, rz); box(0.14, 0.05, rw, MAT.frame, D, 2.2, rz);
  // isolatie tegen de loodswand (aangeduid als dikke wand)
  box(D, H, 0.16, MAT.plaster, D / 2, H / 2, zOut + (side < 0 ? 0.08 : -0.08));
  // bureaus Joost en Sven, tegen de voorgevel (bij de ramen)
  const desks = [[0.95, zc - W / 4 + 0.05, 'Joost'], [0.95, zc + W / 4 - 0.05, 'Sven']];
  for (const [x, z, name] of desks) {
    box(0.7, 0.04, Math.min(1.4, W / 2 - 0.2), MAT.wood, x, 0.74, z);
    for (const [dx, dz] of [[-0.3, -0.55], [0.3, -0.55], [-0.3, 0.55], [0.3, 0.55]]) box(0.04, 0.72, 0.04, MAT.frame, x + dx, 0.36, z + dz * Math.min(1, (W / 2 - 0.2) / 1.4));
    box(0.45, 0.45, 0.45, MAT.chair, x + 0.65, 0.5, z);
    box(0.05, 0.5, 0.45, MAT.chair, x + 0.85, 0.85, z);
    const s = textSprite(name, { width: 0.9, bold: true }); s.position.set(x, 1.5, z); g.add(s);
  }
  // radiator = verwarmd
  box(0.08, 0.5, 0.9, MAT.radiator, D - 0.12, 0.35, side < 0 ? z0 + 0.6 : z1 - 0.6);
  const lab = textSprite('kantoor Joost & Sven · verwarmd', { width: 2.6, bg: 'rgba(45,106,79,0.92)', color: '#fff' });
  lab.position.set(D / 2, H + 0.5, zc); g.add(lab);
}

function updateDoor(instant) {
  const target = THREE.MathUtils.degToRad(P().door);
  door.angle = instant ? target : door.angle + (target - door.angle) * 0.12;
  door.group.rotation.z = -door.angle;
  door.group.updateMatrixWorld(true);
  const H = door.plateH;
  door.cables.forEach((c, i) => {
    const s = i === 0 ? -1 : 1;
    const corner = door.group.localToWorld(new THREE.Vector3(-0.03, -H + 0.05, s * (door.plateW / 2 - 0.2)));
    const arr = c.geometry.attributes.position.array;
    arr[0] = door.anchors[i].x; arr[1] = door.anchors[i].y; arr[2] = door.anchors[i].z;
    arr[3] = corner.x; arr[4] = corner.y; arr[5] = corner.z;
    c.geometry.attributes.position.needsUpdate = true;
  });
}
function applyOpacity() {
  const o = P().opacity / 100;
  MAT.shell.opacity = o; MAT.shell.depthWrite = o > 0.98; MAT.shell.visible = o > 0.02;
  MAT.gable.opacity = Math.max(o, 0.3); MAT.gable.depthWrite = o > 0.98;
}
function applyClip() { clipPlane.constant = P().clip > 0 ? -P().clip : 1000; }

// ---------------------------------------------------------------- items
const itemMeshes = new Map();
function surfaceAt(surface, u, v) {
  const L = P().length;
  if (surface === 'shell') { const p = profile(v); return { pos: new THREE.Vector3(u, p.y, p.z), n: new THREE.Vector3(0, p.ny, p.nz) }; }
  if (surface === 'back') return { pos: new THREE.Vector3(L, v, u), n: new THREE.Vector3(-1, 0, 0) };
  return { pos: new THREE.Vector3(0, v, u), n: new THREE.Vector3(1, 0, 0) };
}
function uvFromPoint(surface, p) {
  const h = P().wallH, R = P().width / 2, T = profLen();
  if (surface === 'shell') {
    let t;
    if (p.y < h) t = p.z < 0 ? p.y : T - p.y;
    else { const a = Math.atan2(p.y - h, p.z); t = h + R * (Math.PI - a); }
    return { u: p.x, v: t };
  }
  return { u: p.z, v: p.y };
}
function clampItem(it) {
  const L = P().length, R = P().width / 2, T = profLen();
  if (it.kind === 'panel') {
    const pw = it.rot ? it.h : it.w, ph = it.rot ? it.w : it.h;
    if (it.surface === 'shell') {
      it.u = THREE.MathUtils.clamp(it.u, pw / 2 + 0.05, L - pw / 2 - 0.05);
      it.v = THREE.MathUtils.clamp(it.v, ph / 2, T - ph / 2);
    } else {
      it.u = THREE.MathUtils.clamp(it.u, -R + pw / 2 + 0.05, R - pw / 2 - 0.05);
      const top = wallTop(Math.abs(it.u) + pw / 2 > R ? R : Math.abs(it.u) + pw / 2);
      it.v = THREE.MathUtils.clamp(it.v, ph / 2, Math.max(ph / 2, top - ph / 2));
    }
  } else {
    const c = Math.abs(Math.cos(it.rot)), s = Math.abs(Math.sin(it.rot));
    const ex = (it.w * c + it.d * s) / 2, ez = (it.w * s + it.d * c) / 2;
    it.x = THREE.MathUtils.clamp(it.x, ex + 0.05, L - ex - 0.05);
    it.z = THREE.MathUtils.clamp(it.z, -R + ez + 0.05, R - ez - 0.05);
  }
}
function makeMesh(it) {
  let m;
  if (it.kind === 'panel') {
    const t = PANEL_TYPES[it.type];
    m = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, t.th), MAT[it.type].clone());
  } else {
    const t = FLOOR_TYPES[it.type];
    const mat = t.tex ? MAT[t.tex].clone() : new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.7 });
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), mat); body.position.y = it.h / 2;
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    if (it.type === 'stelling') { // planken aanduiden
      for (let k = 1; k < 4; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(it.w + 0.02, 0.03, it.d + 0.02), MAT.frame); s.position.y = (it.h * k) / 4; g.add(s); }
      body.material.transparent = true; body.material.opacity = 0.35;
    }
    if (it.type === 'bus') { const r = new THREE.Mesh(new THREE.BoxGeometry(it.w * 0.9, it.h * 0.45, it.d * 0.35), new THREE.MeshStandardMaterial({ color: 0x334, roughness: 0.3 })); r.position.set(0, it.h * 0.72, it.d * 0.25); g.add(r); }
    m = g;
  }
  m.traverse(o => { o.userData.id = it.id; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return m;
}
function placeMesh(m, it) {
  if (it.kind === 'panel') {
    const th = PANEL_TYPES[it.type].th;
    const s = surfaceAt(it.surface, it.u, it.v);
    const Z = s.n.clone();
    let X = it.surface === 'shell' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0).cross(Z).normalize();
    let Y = new THREE.Vector3().crossVectors(Z, X);
    if (Y.y < -1e-6) { X.negate(); Y.negate(); }
    const basis = new THREE.Matrix4().makeBasis(X, Y, Z);
    m.quaternion.setFromRotationMatrix(basis);
    if (it.rot) m.rotateZ(Math.PI / 2);
    m.position.copy(s.pos).addScaledVector(Z, th / 2 + 0.015);
  } else {
    m.position.set(it.x, 0, it.z); m.rotation.y = it.rot;
  }
}
function rebuildItems() {
  disposeGroup(itemsGroup); itemMeshes.clear();
  for (const it of state.items) { clampItem(it); const m = makeMesh(it); placeMesh(m, it); itemsGroup.add(m); itemMeshes.set(it.id, m); }
  highlight();
}
function highlight() {
  for (const [id, m] of itemMeshes) m.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.setHex(id === selectedId ? 0x2d6a4f : 0x000000); });
  renderSelection();
}
function nextId() { return state.items.reduce((a, b) => Math.max(a, b.id), 0) + 1; }
function addPanel(type) {
  const t = PANEL_TYPES[type], T = profLen();
  const it = { id: nextId(), kind: 'panel', type, surface: 'shell', u: P().length / 2, v: Math.min(T / 2 - 1, 1.2), w: t.w, h: t.h, rot: 0 };
  state.items.push(it); selectedId = it.id; rebuildItems(); save();
  hint('Paneel toegevoegd op de linkerwand. Sleep het naar de plek; het volgt de boog, de achterwand en de voorgevel.');
}
function addFloor(type) {
  const t = FLOOR_TYPES[type];
  const it = { id: nextId(), kind: 'floor', type, x: P().length / 2, z: 0, rot: 0, w: t.w, d: t.d, h: t.h };
  state.items.push(it); selectedId = it.id; rebuildItems(); save();
  hint('Toegevoegd midden in de loods. Sleep het naar de plek.');
}
function removeSelected() { state.items = state.items.filter(i => i.id !== selectedId); selectedId = null; rebuildItems(); save(); }
function duplicateSelected() {
  const it = state.items.find(i => i.id === selectedId); if (!it) return;
  const c = { ...it, id: nextId() };
  if (c.kind === 'panel') c.u += c.w * 0.6 + 0.2; else c.x += c.w * 0.6 + 0.4;
  state.items.push(c); selectedId = c.id; rebuildItems(); save();
}

// ---------------------------------------------------------------- selectie-UI
function renderSelection() {
  const el = $('sel');
  const it = state.items.find(i => i.id === selectedId);
  if (!it) { el.className = 'empty'; el.textContent = 'Tik op een paneel of meubel.'; return; }
  el.className = '';
  const label = it.kind === 'panel' ? PANEL_TYPES[it.type].label : FLOOR_TYPES[it.type].label;
  const where = it.kind === 'panel' ? ({ shell: 'boogwand', back: 'achterwand', front: 'voorgevel (binnen)' })[it.surface] : 'vloer';
  el.innerHTML = `<div class="row"><b>${label}</b> <span class="note">· ${where}</span></div>` +
    (it.kind === 'panel'
      ? `<div class="row"><label>Breedte</label><input type="number" step="0.1" min="0.2" max="6" id="selW" value="${it.w}"> m</div>
         <div class="row"><label>Hoogte</label><input type="number" step="0.1" min="0.2" max="4" id="selH" value="${it.h}"> m</div>
         <div class="btns"><button id="selRot">Kantelen 90°</button><button id="selMove">Naar ${it.surface === 'shell' ? 'achterwand' : 'boogwand'}</button></div>`
      : `<div class="row"><label>Breedte</label><input type="number" step="0.1" min="0.2" max="8" id="selW" value="${it.w}"> m</div>
         <div class="row"><label>Diepte</label><input type="number" step="0.05" min="0.05" max="8" id="selD" value="${it.d}"> m</div>
         <div class="row"><label>Hoogte</label><input type="number" step="0.1" min="0.1" max="4" id="selHt" value="${it.h}"> m</div>
         <div class="btns"><button id="selRot">Draai 15°</button><button id="selRot90">Draai 90°</button></div>`) +
    `<div class="btns"><button id="selDup">Dupliceer</button><button id="selDel" class="danger">Verwijder</button></div>`;
  const num = (id, key) => { const e = $(id); if (e) e.oninput = () => { const v = parseFloat(e.value); if (v > 0) { it[key] = v; rebuildItems(); save(); } }; };
  num('selW', 'w'); num('selH', 'h'); num('selD', 'd'); num('selHt', 'h');
  $('selRot').onclick = () => { if (it.kind === 'panel') it.rot = it.rot ? 0 : 1; else it.rot += Math.PI / 12; rebuildItems(); save(); };
  if ($('selRot90')) $('selRot90').onclick = () => { it.rot += Math.PI / 2; rebuildItems(); save(); };
  if ($('selMove')) $('selMove').onclick = () => {
    if (it.surface === 'shell') { it.surface = 'back'; it.u = 0; it.v = 1.2; } else { it.surface = 'shell'; it.u = P().length / 2; it.v = 1.2; }
    rebuildItems(); save();
  };
  $('selDup').onclick = duplicateSelected; $('selDel').onclick = removeSelected;
}

// ---------------------------------------------------------------- muis / touch
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let drag = null;
function setRay(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function itemAtPointer() {
  const hits = ray.intersectObjects(itemsGroup.children, true);
  return hits.length ? hits[0].object.userData.id : null;
}
function wallHit() {
  const list = [surfaces.shell, surfaces.back, surfaces.front].filter(Boolean);
  const hits = ray.intersectObjects(list, false);
  for (const h of hits) {
    const surface = h.object.name;
    const { u, v } = uvFromPoint(surface, h.point);
    const n = surfaceAt(surface, u, v).n;
    if (n.dot(ray.ray.direction) < 0) return { surface, u, v }; // alleen de binnenkant die naar de camera kijkt
  }
  return null;
}
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (e) => {
  setRay(e);
  const id = itemAtPointer();
  if (id == null) { if (selectedId != null) { selectedId = null; highlight(); } return; }
  e.stopImmediatePropagation(); e.preventDefault();
  selectedId = id; highlight();
  const it = state.items.find(i => i.id === id);
  drag = { it, moved: false, du: 0, dv: 0, dx: 0, dz: 0 };
  if (it.kind === 'floor') {
    const p = new THREE.Vector3(); ray.ray.intersectPlane(floorPlane, p);
    if (p) { drag.dx = it.x - p.x; drag.dz = it.z - p.z; }
  } else {
    const w = wallHit();
    if (w && w.surface === it.surface) { drag.du = it.u - w.u; drag.dv = it.v - w.v; }
  }
  canvas.setPointerCapture(e.pointerId);
}, { capture: true });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  e.stopImmediatePropagation();
  setRay(e);
  const it = drag.it, m = itemMeshes.get(it.id);
  if (it.kind === 'floor') {
    const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(floorPlane, p)) return;
    it.x = p.x + drag.dx; it.z = p.z + drag.dz;
  } else {
    const w = wallHit(); if (!w) return;
    if (w.surface !== it.surface) { it.surface = w.surface; drag.du = 0; drag.dv = 0; }
    it.u = w.u + drag.du; it.v = w.v + drag.dv;
  }
  drag.moved = true; clampItem(it); placeMesh(m, it);
}, { capture: true });
const endDrag = (e) => { if (!drag) return; e.stopImmediatePropagation(); if (drag.moved) save(); drag = null; };
canvas.addEventListener('pointerup', endDrag, { capture: true });
canvas.addEventListener('pointercancel', endDrag, { capture: true });

// ---------------------------------------------------------------- camera
function setCam(name) {
  const L = P().length, R = P().width / 2;
  const oz = P().officeSide === 'links' ? -R + P().officeW / 2 : R - P().officeW / 2;
  const views = {
    buiten: [[-12, 6, 10], [L * 0.35, 1.5, 0]],
    binnen: [[L - 0.8, 1.7, 0.8], [1, 1.6, 0]],
    kantoor: [[P().officeD + 2.6, 1.7, oz * 0.6], [0.8, 1.3, oz]],
    boven: [[L / 2, 24, 0.01], [L / 2, 0, 0]],
  };
  const [p, t] = views[name] || views.buiten;
  camera.position.set(...p); controls.target.set(...t); controls.update();
}

// ---------------------------------------------------------------- opslag
const LS_AUTO = 'loods3d.autosave', LS_LAYOUTS = 'loods3d.layouts';
function save() { localStorage.setItem(LS_AUTO, JSON.stringify(state)); }
function loadLayouts() { try { return JSON.parse(localStorage.getItem(LS_LAYOUTS) || '{}'); } catch { return {}; } }
function refreshLayoutList() {
  const sel = $('layouts'); sel.innerHTML = '';
  for (const n of Object.keys(loadLayouts())) { const o = document.createElement('option'); o.value = o.textContent = n; sel.appendChild(o); }
}
function applyState(s) {
  state = { params: { ...DEFAULT_PARAMS, ...(s.params || {}) }, items: (s.items || []).map(i => ({ ...i })) };
  selectedId = null; syncUI(); buildBuilding(); rebuildItems(); save();
}
function hint(t) { $('hint').textContent = t; }

// ---------------------------------------------------------------- UI-koppeling
const SLIDERS = [['length', v => `${v} m`], ['width', v => `${v} m`], ['wallH', v => `${(+v).toFixed(1)} m`], ['door', v => `${v}°`],
  ['opacity', v => `${v}%`], ['clip', v => +v > 0 ? `${(+v).toFixed(1)} m` : 'uit'], ['officeW', v => `${(+v).toFixed(1)} m`],
  ['officeD', v => `${(+v).toFixed(1)} m`], ['officeH', v => `${(+v).toFixed(1)} m`]];
const REBUILD = new Set(['length', 'width', 'wallH', 'officeW', 'officeD', 'officeH']);
function syncUI() {
  for (const [k, f] of SLIDERS) { $(k).value = P()[k]; $(k + 'V').textContent = f(P()[k]); }
  $('office').checked = P().office; $('officeSide').value = P().officeSide;
  $('clip').max = P().length;
}
for (const [k, f] of SLIDERS) {
  $(k).addEventListener('input', () => {
    P()[k] = parseFloat($(k).value); $(k + 'V').textContent = f(P()[k]);
    if (REBUILD.has(k)) { buildBuilding(); rebuildItems(); $('clip').max = P().length; }
    else if (k === 'opacity') applyOpacity();
    else if (k === 'clip') applyClip();
    save();
  });
}
$('office').addEventListener('change', () => { P().office = $('office').checked; buildBuilding(); save(); });
$('officeSide').addEventListener('change', () => { P().officeSide = $('officeSide').value; buildBuilding(); save(); });
document.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => setCam(b.dataset.cam));
document.querySelectorAll('[data-door]').forEach(b => b.onclick = () => { P().door = +b.dataset.door; $('door').value = P().door; $('doorV').textContent = `${P().door}°`; save(); });
document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => addPanel(b.dataset.panel));
for (const [k, t] of Object.entries(FLOOR_TYPES)) { const b = document.createElement('button'); b.textContent = t.label; b.onclick = () => addFloor(k); $('floorBtns').appendChild(b); }
$('saveLayout').onclick = () => { const n = $('layoutName').value.trim() || `indeling ${new Date().toLocaleString('nl-NL')}`; const l = loadLayouts(); l[n] = state; localStorage.setItem(LS_LAYOUTS, JSON.stringify(l)); refreshLayoutList(); $('layouts').value = n; hint(`Bewaard als "${n}".`); };
$('loadLayout').onclick = () => { const l = loadLayouts(); const s = l[$('layouts').value]; if (s) { applyState(s); hint(`Indeling "${$('layouts').value}" geladen.`); } };
$('delLayout').onclick = () => { const l = loadLayouts(); delete l[$('layouts').value]; localStorage.setItem(LS_LAYOUTS, JSON.stringify(l)); refreshLayoutList(); };
$('export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' })); a.download = 'loods-indeling.json'; a.click(); };
$('import').onclick = () => $('importFile').click();
$('importFile').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { applyState(JSON.parse(await f.text())); hint('Indeling geïmporteerd.'); } catch { hint('Kon het bestand niet lezen.'); } };
$('reset').onclick = () => { if (confirm('Terug naar de voorbeeldindeling? Je huidige indeling gaat verloren (tenzij bewaard).')) applyState(examplePreset()); };
$('share').onclick = async () => {
  const url = location.origin + location.pathname + '#s=' + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  try { await navigator.clipboard.writeText(url); hint('Deel-link gekopieerd.'); } catch { prompt('Kopieer deze link:', url); }
};
$('toggleUi').onclick = () => { $('ui').classList.toggle('hidden'); document.body.classList.toggle('ui-hidden'); };
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId != null) removeSelected();
  if (e.key === 'r' && selectedId != null) { const it = state.items.find(i => i.id === selectedId); if (it.kind === 'floor') it.rot += Math.PI / 12; else it.rot = it.rot ? 0 : 1; rebuildItems(); save(); }
  if (e.key === 'd' && selectedId != null) duplicateSelected();
});

// ---------------------------------------------------------------- start
function initialState() {
  const m = location.hash.match(/^#s=(.+)$/);
  if (m) { try { history.replaceState(null, '', location.pathname); return JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch { /* val terug */ } }
  try { const s = JSON.parse(localStorage.getItem(LS_AUTO)); if (s && s.items) return s; } catch { /* val terug */ }
  return examplePreset();
}
applyState(initialState());
refreshLayoutList();
setCam('buiten');
hint('Tik op een paneel of meubel om het te slepen. Toets R draait, Delete verwijdert, D dupliceert.');

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
renderer.setAnimationLoop(() => { updateDoor(false); controls.update(); renderer.render(scene, camera); });
