import * as Three from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/Reflector.js';

const rightAngle = Math.PI / 2;
export const dimensions = { width: 3.28, depth: 3.54, height: 2.50 };
const { width, depth, height } = dimensions;
const left = -width / 2;
const back = -depth / 2;
const right = width / 2;
const showerEdge = .38;
const showerFront = -.51;
const rightWallTileOffset = .21;
const flush = { width:.218, height:.134, y:.984, z:.12 };
const window = { left: -1.02, right: .16, sill: 1.29, head: 2.18 };

const standard = (color, roughness, metalness = 0) => new Three.MeshStandardMaterial({ color, roughness, metalness });

export function createShell(scene) {
 const plaster = standard('#eee8dd', .91);
 plaster.shadowSide = Three.DoubleSide;
 const reveals = standard('#eee9e2', .86);
 const shell = new Three.Group();
 shell.name = 'Raum';
 scene.add(shell);

 const floor = { width, height: depth, center: [0, 0, 0], rotation: [-rightAngle, 0, 0], u: 0, v: 0 };
 function backStrip(x1, x2, y1, y2, u = x1 - left) {
  return { width: x2 - x1, height: y2 - y1, center: [(x1 + x2) / 2, (y1 + y2) / 2, back], rotation: [0, 0, 0], u, v: y1 };
 }
 function sideStrip(side, z1, z2, h) {
  return {
   width: z2 - z1, height: h, center: [side, h / 2, (z1 + z2) / 2],
   rotation: [0, side === left ? rightAngle : -rightAngle, 0],
   u: side === left ? depth / 2 - z2 : z1 - back + rightWallTileOffset, v: 0
  };
 }
 function walls(ordinary, wet) {
  return [
   sideStrip(left, back, depth / 2, ordinary),
   backStrip(left, window.left, 0, ordinary),
   backStrip(window.left, window.right, 0, Math.min(ordinary, window.sill)),
   backStrip(window.right, showerEdge, 0, ordinary),
   backStrip(showerEdge, right, 0, wet),
   sideStrip(right, back, showerFront, wet),
   sideStrip(right, showerFront, depth / 2, ordinary),
   ...(ordinary > window.head ? [backStrip(window.left, window.right, window.head, ordinary)] : [])
  ];
 }
 function plane(piece, material) {
  const mesh = new Three.Mesh(new Three.PlaneGeometry(piece.width, piece.height), material);
  mesh.position.set(...piece.center);
  mesh.rotation.set(...piece.rotation);
  mesh.receiveShadow = true;
  shell.add(mesh);
  return mesh;
 }
 plane(floor, plaster);
 for (const piece of walls(height, height)) plane(piece, plaster);
 plane({ ...floor, center: [0, height, 0], rotation: [rightAngle, 0, 0] }, plaster);
 for (const surface of shell.children) surface.castShadow = true;

 const box = (w, h, d, x, y, z) => {
  const mesh = new Three.Mesh(new Three.BoxGeometry(w, h, d), reveals);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  shell.add(mesh);
 };
 const apertureWidth = window.right - window.left;
 const apertureHeight = window.head - window.sill;
 const centerX = (window.left + window.right) / 2;
 const centerY = (window.sill + window.head) / 2;
 const recess = back - .08;
 for (const x of [window.left - .008, window.right + .008]) box(.016, apertureHeight + .023, .18, x, centerY, recess);
 for (const y of [window.sill - .008, window.head + .008]) box(apertureWidth + .025, .016, .18, centerX, y, recess);
 box(apertureWidth + .08, .029, .24, centerX, window.sill - .026, back - .044);
 // Both buttons are cut from the same wall tile and sit inside a narrow joint.
 const flushStart = flush.z - flush.width / 2;
 const flushButtons = [[.0022,.130],[.132,.2158]].map(([start,end]) => ({
  width:end-start, height:flush.height-.0044, center:[right,flush.y,flushStart+(start+end)/2],
  rotation:[0,-rightAngle,0], u:flushStart+start-back+rightWallTileOffset,
  v:flush.y-flush.height/2+.0022, offset:.0062
 }));
 return { floor, walls, flushButtons };
}

export function createFixtures(scene, { oakMap, oakNormal, daylightView }) {
 const fixtures = new Three.Group();
 fixtures.name = 'Ausstattung';
 scene.add(fixtures);

 const ceramic = new Three.MeshPhysicalMaterial({
  color: '#f1efe9', roughness: .23, clearcoat: .29, clearcoatRoughness: .26
 });
 const tray = standard('#eae7df', .46);
 const white = standard('#e6e1d7', .36);
 const shadow = standard('#2c2924', .52);
 const gunmetal = standard('#514c46', .25, .78);
 const anodized = standard('#403d35', .32, .64);
 const chrome = standard('#ccc4b5', .25, .83);
 const oak = new Three.MeshStandardMaterial({
  map: oakMap, color: '#d1ab88', normalMap: oakNormal, normalScale: new Three.Vector2(.31, .31), roughness: .53
 });

 function mesh(geometry, material, xyz, parent = fixtures) {
  const object = new Three.Mesh(geometry, material);
  object.position.set(...xyz);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
 }
 function box(w, h, d, xyz, material, radius = .007, parent = fixtures) {
  const geometry = radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new Three.BoxGeometry(w, h, d);
  return mesh(geometry, material, xyz, parent);
 }
 function pipe(points, radius, material, parent = fixtures) {
  const path = new Three.CatmullRomCurve3(points.map(p => new Three.Vector3(...p)));
  return mesh(new Three.TubeGeometry(path, 32, radius, 12), material, [0, 0, 0], parent);
 }
 function rod(start, end, radius, material, parent = fixtures) {
  const a = new Three.Vector3(...start), b = new Three.Vector3(...end), delta = b.clone().sub(a);
  const object = mesh(new Three.CylinderGeometry(radius, radius, delta.length(), 20), material, a.lerp(b, .5).toArray(), parent);
  object.quaternion.setFromUnitVectors(new Three.Vector3(0, 1, 0), delta.normalize());
  return object;
 }
 function vessel(profile, position, scale, material, parent) {
  const geometry = new Three.LatheGeometry(profile.map(point => new Three.Vector2(...point)), 64);
  const object = mesh(geometry, material, position, parent);
  object.scale.set(...scale);
  return object;
 }
 const contactCanvas=document.createElement('canvas');
 contactCanvas.width=contactCanvas.height=96;
 const contactContext=contactCanvas.getContext('2d');
 const contactGradient=contactContext.createRadialGradient(48,48,4,48,48,48);
 contactGradient.addColorStop(0,'rgba(32,26,22,.92)');
 contactGradient.addColorStop(.44,'rgba(32,26,22,.50)');
 contactGradient.addColorStop(1,'rgba(32,26,22,0)');
 contactContext.fillStyle=contactGradient;
 contactContext.fillRect(0,0,96,96);
 const contactMap=new Three.CanvasTexture(contactCanvas);
 contactMap.colorSpace=Three.SRGBColorSpace;
 function contact(width,height,position,rotation,opacity) {
  const material=new Three.MeshBasicMaterial({map:contactMap,opacity,transparent:true,depthWrite:false});
  const surface=new Three.Mesh(new Three.PlaneGeometry(width,height),material);
  surface.position.set(...position);
  surface.rotation.set(...rotation);
  fixtures.add(surface);
 }

 // The view sits behind recessed glazing and an actual window frame.
 const center = (window.left + window.right) / 2, windowY = (window.sill + window.head) / 2, z = back - .16;
 const windowWidth = window.right - window.left, windowHeight = window.head - window.sill;
 const sky = document.createElement('canvas');
 sky.width = 128; sky.height = 256;
 const g = sky.getContext('2d'), daylight = g.createLinearGradient(28, 0, 80, 256);
 daylight.addColorStop(0, '#c4d6e0');
 daylight.addColorStop(.45, '#eaeff0');
 daylight.addColorStop(1, '#eeece2');
 g.fillStyle = daylight; g.fillRect(0, 0, sky.width, sky.height);
 const glazing = daylightView || new Three.CanvasTexture(sky);
 glazing.colorSpace = Three.SRGBColorSpace;
 if (daylightView) {
  const { width, height } = daylightView.image;
  daylightView.repeat.set(293 / width, 198 / height);
  daylightView.offset.set(559 / width, 1 - 348 / height);
 }
 const glassBackground = new Three.MeshBasicMaterial({ map: glazing, toneMapped: false });
 mesh(new Three.PlaneGeometry(windowWidth, windowHeight), glassBackground, [center, windowY, z - .024]).castShadow = false;
 for (const x of [window.left + .023, window.right - .023]) box(.046, windowHeight, .045, [x, windowY, z], anodized, .002);
 for (const y of [window.sill + .023, window.head - .023]) box(windowWidth, .046, .045, [center, y, z], anodized, .002);
 box(.034, windowHeight - .085, .032, [center + .20, windowY, z + .002], anodized, .002);
 box(.028, .10, .018, [window.right - .076, windowY, z + .028], chrome, .004);

 const vanity = new Three.Group();
 vanity.position.set(left + .265, 0, -.89);
 vanity.rotation.y = rightAngle;
 fixtures.add(vanity);
 box(1.17, .445, .489, [0, .615, 0], oak, .012, vanity);
 for (const y of [.512, .723]) {
  box(1.146, .20, .025, [0, y, .255], oak, .006, vanity);
  box(.24, .012, .013, [0, y + .065, .273], gunmetal, .003, vanity);
 }
 box(1.202, .033, .531, [0, .853, .003], tray, .007, vanity);
 contact(1.16,1.61,[left+.29,.0055,-.865],[-rightAngle,0,0],.25);
 contact(1.37,.61,[left+.0055,.56,-.89],[0,rightAngle,0],.30);
 vessel([[0,0],[.153,0],[.174,.018],[.19,.085],[.19,.11],[.186,.116],[.169,.116],[.164,.083],[.146,.035],[.053,.022],[0,.022]],
  [-.075,.87,.043], [1.46,1,1], ceramic, vanity);
 rod([-.075,.892,.043],[-.075,.899,.043],.017,chrome,vanity);
 rod([-.072,.868,-.121],[-.072,.887,-.121],.029,chrome,vanity);
 pipe([[-.072,.887,-.121],[-.072,1.072,-.121],[-.072,1.105,-.092],[-.072,1.096,.052],[-.072,1.063,.075]], .012, chrome, vanity);
 rod([-.055,.939,-.121],[-.02,.965,-.121],.006,chrome,vanity);
 const mirrorWidth = 1.09, mirrorHeight = .76, mirrorY = 1.642;
 box(mirrorWidth + .025, mirrorHeight + .024, .025, [0, mirrorY, -.222], gunmetal, .01, vanity);
 const mirror = new Reflector(new Three.PlaneGeometry(mirrorWidth, mirrorHeight), {
  color: 0xe4e1d9, textureWidth: 640, textureHeight: 448, clipBias: .002
 });
 mirror.position.set(0, mirrorY, -.207);
 vanity.add(mirror);

 const bottle = standard('#6a5136', .28);
 rod([.47,.87,.048],[.47,1.015,.048],.036,bottle,vanity);
 rod([.47,1.015,.048],[.47,1.050,.048],.013,gunmetal,vanity);
 box(.033,.011,.051,[.47,1.055,.062],gunmetal,.004,vanity);

 const showerWidth = right - showerEdge - .018, showerDepth = showerFront - back - .014;
 const showerX = (right + showerEdge) / 2, showerZ = (back + showerFront) / 2;
 box(showerWidth, .044, showerDepth, [showerX, .024, showerZ], tray, .009);
 contact(showerWidth+.20,showerDepth+.19,[showerX,.0055,showerZ],[-rightAngle,0,0],.38);
 box(.095, .006, .095, [showerX + .31, .048, back + .29], chrome, .002);
 for (let i = -2; i <= 2; i++) box(.069, .002, .003, [showerX + .31, .052, back + .29 + i * .012], shadow, 0);
 const glass = new Three.MeshPhysicalMaterial({
  color: '#f3fcfa', transmission: .93, roughness: .11, thickness: .009,
  ior: 1.5, attenuationColor: '#c9e1d6', attenuationDistance: .16
 });
 const screen = box(.010, 2.02, showerDepth - .08, [showerEdge + .035, 1.068, showerZ - .025], glass, 0);
 screen.castShadow = false; screen.receiveShadow = false; glass.depthWrite = false;
 box(.017, 2.04, .025, [showerEdge + .035, 1.072, back + .017], gunmetal, .002);
 rod([showerEdge + .035, 2.078, showerFront - .095], [right - .015, 2.078, showerFront - .095], .009, chrome);
 rod([showerX + .17, 1.08, back + .074], [showerX + .17, 2.144, back + .074], .013, chrome);
 pipe([[showerX + .17, 2.144, back + .074], [showerX + .17, 2.18, back + .136], [showerX + .17, 2.18, back + .385]], .012, chrome);
 rod([showerX + .17, 2.145, back + .385], [showerX + .17, 2.183, back + .385], .112, chrome);
 box(.162, .061, .034, [showerX + .17, 1.09, back + .033], chrome, .006);
 pipe([[showerX+.21,1.082,back+.065],[showerX+.24,.81,back+.089],[showerX+.34,.83,back+.092],[showerX+.36,1.43,back+.083]],.006,chrome);
 rod([showerX+.36,1.40,back+.088],[showerX+.34,1.54,back+.092],.015,chrome);

 const toilet = new Three.Group();
 toilet.position.set(right - .12, 0, .12);
 toilet.rotation.y = -rightAngle;
 fixtures.add(toilet);
 box(.255,.134,.14,[0,.343,-.094],ceramic,.026,toilet);
 vessel([[0,0],[.122,0],[.153,.034],[.176,.103],[.182,.144],[.180,.167],[0,.167]],
  [0,.264,.155], [1,1,1.43], ceramic, toilet);
 vessel([[0,0],[.175,0],[.183,.006],[.179,.015],[.170,.023],[.119,.025],[0,.025]],
  [0,.434,.155], [1,1,1.43], ceramic, toilet);
 contact(.99,.65,[right-.29,.0055,.12],[-rightAngle,0,0],.32);
 contact(.53,.56,[right-.0055,.36,.12],[0,-rightAngle,0],.48);
 const flushJoint=new Three.Mesh(new Three.PlaneGeometry(flush.width,flush.height),shadow);
 flushJoint.position.set(right-.0053,flush.y,flush.z);
 flushJoint.rotation.y=-rightAngle;
 flushJoint.receiveShadow=true;
 fixtures.add(flushJoint);

 const cloth = new Three.MeshStandardMaterial({ roughness:.94, side:Three.DoubleSide, vertexColors:true });
 const towelRail = new Three.Group();
 towelRail.position.set(right - .055, 0, -.23);
 towelRail.rotation.y = -rightAngle;
 fixtures.add(towelRail);
 for (const x of [-.165,.165]) rod([x,1.16,-.05],[x,1.16,.025],.010,chrome,towelRail);
 rod([-.18,1.16,.025],[.18,1.16,.025],.011,chrome,towelRail);
 const drape = new Three.PlaneGeometry(.246,.287,30,26);
 const points = drape.getAttribute('position'), uv = drape.getAttribute('uv'), colors = [];
 for(let i=0;i<points.count;i++) {
  const t = 1 - uv.getY(i), across = points.getX(i);
  const fold = Math.sin(across * 54 + t * 1.2) * .0065 * t;
  points.setZ(i,.012 + .012 * Math.sin(t * Math.PI) + fold);
  points.setY(i,points.getY(i) + Math.sin(across * 31) * t * .003);
  const hem = t>.92 && Math.floor(t*154)%3===0;
  const shade = new Three.Color(hem?'#978875':'#b8ac9b');
  colors.push(shade.r,shade.g,shade.b);
 }
 drape.computeVertexNormals();
 drape.setAttribute('color',new Three.Float32BufferAttribute(colors,3));
 mesh(drape,cloth,[0,1.018,.033],towelRail);

 const lamp = new Three.MeshBasicMaterial({ color:'#fff2dd', toneMapped:false });
 for(const [x,z] of [[-.76,-.25],[.98,-.88]]) {
  rod([x,height-.013,z],[x,height-.003,z],.043,white);
  rod([x,height-.014,z],[x,height-.012,z],.031,lamp).castShadow=false;
  const light = new Three.SpotLight('#fff0db',14,4.6,.72,.68);
  light.position.set(x,height-.036,z);
  light.target.position.set(x,.12,z);
  light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  light.shadow.camera.near=.04;
  light.shadow.camera.far=4.6;
  light.shadow.bias=-.00014;
  light.shadow.normalBias=.008;
  scene.add(light,light.target);
 }
}
