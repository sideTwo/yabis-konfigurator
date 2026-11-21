import * as Three from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import '../raumstudio/model-plan.js';
import { createShell, createFixtures, dimensions } from './bath-model.js?v=6';
import { createBathLightingPass } from './bath-lighting.js?v=4';

const { tiles } = window.YabisModelPlan;
const unitCorners = [[0,0], [1,0], [1,1], [0,0], [1,1], [0,1]];
const textureCache = new WeakMap();

function tileAppearance(product) {
 const finish = product.finish || '';
 if (finish === 'Poliert') return { roughness:.24, clearcoat:.29 };
 if (finish.includes('Lappato') || product.id === 'fiordi-bosco-sand-2') return { roughness:.40, clearcoat:.17 };
 if (finish === 'Seidenmatt') return { roughness:.58, clearcoat:.07 };
 return { roughness:.71, clearcoat:0 };
}

function surfaceGeometry(segments, format, surface, image, grain, seed) {
 const positions = [], normals = [], texcoords = [];
 const wall = surface === 'wall', portrait = image.height > image.width;
 const point = new Three.Vector3();
 for (const segment of segments) {
  const rotation = new Three.Euler(...segment.rotation);
  const normal = new Three.Vector3(0, 0, 1).applyEuler(rotation);
  const origin = new Three.Vector3(...segment.center);
  const pieces = tiles(segment.width, segment.height, format, 'kreuz', segment.u, segment.v, .003, surface);
  for (const tile of pieces) {
   // Deterministic face selection. Do not mirror artwork at adjacent seams.
   let hash = Math.imul(tile.col + 104, 374761393) ^ Math.imul(tile.row + 101, 668265263) ^ Math.imul(seed + 1, 1274126177);
   hash = Math.imul(hash ^ (hash >>> 13), 2246822519) >>> 0;
   const crop = .78 + ((hash >>> 8) & 15) / 115;
   const offsetU = ((hash >>> 18) & 127) / 127 * (1 - crop);
   const offsetV = ((hash >>> 25) & 127) / 127 * (1 - crop);
   for (const [ax, ay] of unitCorners) {
    const x = tile.x + (ax - .5) * tile.w, y = tile.y + (ay - .5) * tile.h;
    point.set(x, y, segment.offset ?? .0045).applyEuler(rotation).add(origin);
    positions.push(point.x, point.y, point.z);
    normals.push(normal.x, normal.y, normal.z);
    let u, v;
    if (grain === 'continuous') {
     const xMeters = x + segment.width / 2 + segment.u, yMeters = y + segment.height / 2 + segment.v;
     u = xMeters / 2.54 + seed * .179;
     v = yMeters / 1.68 + seed * .267;
    } else {
     u = Three.MathUtils.lerp(tile.uv[0], tile.uv[2], ax);
     v = Three.MathUtils.lerp(tile.uv[1], tile.uv[3], ay);
     if (hash & 1) { u = 1 - u; v = 1 - v; }
     u = offsetU + u * crop; v = offsetV + v * crop;
    }
    const rotate = wall ? portrait : !portrait && format[0] !== format[1];
    if (rotate) [u, v] = [v, 1 - u];
    texcoords.push(u, v);
   }
  }
 }
 const geometry = new Three.BufferGeometry();
 geometry.setAttribute('position', new Three.Float32BufferAttribute(positions,3));
 geometry.setAttribute('normal', new Three.Float32BufferAttribute(normals,3));
 geometry.setAttribute('uv', new Three.Float32BufferAttribute(texcoords,2));
 geometry.computeBoundingSphere();
 return geometry;
}

function microTexture() {
 const size = 128, bytes = new Uint8Array(size * size * 4);
 let seed = 8663;
 for (let i = 0; i < bytes.length; i += 4) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const noise = 120 + (seed >>> 26);
  bytes[i] = bytes[i+1] = bytes[i+2] = noise;
  bytes[i+3] = 255;
 }
 const texture = new Three.DataTexture(bytes, size, size);
 texture.wrapS = texture.wrapT = Three.RepeatWrapping;
 texture.magFilter = Three.LinearFilter;
 texture.minFilter = Three.LinearMipmapLinearFilter;
 texture.generateMipmaps = true;
 texture.needsUpdate = true;
 return texture;
}

export async function createBathRenderer(width, height) {
 const canvas = document.createElement('canvas');
 const renderer = new Three.WebGLRenderer({ canvas, antialias:true, alpha:false, preserveDrawingBuffer:true });
 renderer.setSize(width, height, false);
 renderer.outputColorSpace = Three.SRGBColorSpace;
 renderer.toneMapping = Three.ACESFilmicToneMapping;
 renderer.toneMappingExposure = .95;
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = Three.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate = false;
 renderer.transmissionResolutionScale = .65;

 const scene = new Three.Scene();
 scene.background = new Three.Color('#e9e3d9');
 const camera = new Three.PerspectiveCamera(48, width / height, .045, 26);
 camera.position.set(.095, 1.56, 2.45);
 camera.lookAt(.045, 1.12, -.80);

 const environment = new RoomEnvironment(), pmrem = new Three.PMREMGenerator(renderer);
 const environmentTarget = pmrem.fromScene(environment, .025);
 scene.environment = environmentTarget.texture;
 scene.environmentIntensity = .46;
 environment.dispose(); pmrem.dispose();

 // The structural room and independently replaceable surfaces come first.
 const shell = createShell(scene);
 const floor = new Three.Group(), wall = new Three.Group();
 floor.name = 'Bodenfliesen'; wall.name = 'Wandfliesen';
 scene.add(floor, wall);

 const loader = new Three.TextureLoader();
 const asset = name => new URL('../assets/studio/bad-3d/' + name, import.meta.url).href;
 const [oakMap, oakNormal, daylightView, roomLight] = await Promise.all([
  loader.loadAsync(asset('oak-veneer.webp')).catch(() => null),
  loader.loadAsync(asset('oak-normal.webp')).catch(() => null),
  loader.loadAsync(new URL('../assets/studio/bad-og-basis-glas.webp', import.meta.url)).catch(() => null),
  loader.loadAsync(asset('raumlicht.png')).catch(() => null)
 ]);
 const lighting = renderer.extensions.has('EXT_color_buffer_float') ? createBathLightingPass(width,height,camera,roomLight) : null;
 for (const texture of [oakMap, oakNormal]) if(texture)texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
 if(oakMap)oakMap.colorSpace = Three.SRGBColorSpace;
 let furnished = false;

 scene.add(new Three.HemisphereLight('#eef4fa','#b9a899', .82));
 const sun = new Three.DirectionalLight('#fff3de',1.66);
 sun.position.set(-2.17,4.54,-6.8);
 sun.target.position.set(.35,.08,.51);
 sun.castShadow = true;
 sun.shadow.mapSize.set(1536,1536);
 Object.assign(sun.shadow.camera, { left:-2.6,right:2.6,bottom:-2.8,top:2.8,near:.20,far:14 });
 sun.shadow.bias = -.00012;
 sun.shadow.normalBias = .008;
 scene.add(sun,sun.target);
 const windowLight=new Three.SpotLight('#e3effa',11,7,.94,.75);
 windowLight.position.set(-.46,1.92,-1.83);
 windowLight.target.position.set(.17,.68,.68);
 scene.add(windowLight,windowLight.target);

 const doorway = new Three.PointLight('#fff6e9', 6, 8);
 doorway.position.set(-.25, 1.87, 2.05);
 scene.add(doorway);

 function texture(image) {
  if (textureCache.has(image)) return textureCache.get(image);
  const map = new Three.Texture(image);
  map.colorSpace = Three.SRGBColorSpace;
  map.wrapS = map.wrapT = Three.MirroredRepeatWrapping;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  map.needsUpdate = true;
  textureCache.set(image, map);
  return map;
 }

 const micro = microTexture();
 const keys = new Map();
 function updateSurface(surface, selection, assetInfo, grout) {
  const group = surface === 'floor' ? floor : wall;
  const format = selection[surface+'Format'], grain = selection[surface+'Grain'];
  const seed = selection[surface+'GrainSeed'] || 0;
  const tiledHigh = selection.wallHeight === 'full';
  const key = [assetInfo.id, format.join(','), grain, seed, grout.join(','), surface === 'wall' && tiledHigh].join('/');
  if (keys.get(surface) === key) return;

  const segments = surface === 'floor' ? [shell.floor] : shell.walls(tiledHigh ? dimensions.height : 1.2, dimensions.height);
  const next = new Three.Group();
  const mortar = new Three.MeshStandardMaterial({
   color: 'rgb('+grout.map(channel=>Math.round(channel*.92)).join(',')+')', roughness:.94
  });
  for (const face of segments) {
   const mesh = new Three.Mesh(new Three.PlaneGeometry(face.width, face.height), mortar);
   const rotation = new Three.Euler(...face.rotation);
   mesh.rotation.copy(rotation);
   mesh.position.set(...face.center).add(new Three.Vector3(0,0,.002).applyEuler(rotation));
   mesh.receiveShadow = true;
   next.add(mesh);
  }
  if(surface === 'wall' && !tiledHigh) {
   const edge = new Three.MeshStandardMaterial({ color:'#c8c0b3', roughness:.48, metalness:.28 });
   for(const face of segments.filter(piece=>piece.height===1.2)) {
    const profile = new Three.Mesh(new Three.BoxGeometry(face.width-.002,.007,.006),edge);
    const rotation = new Three.Euler(...face.rotation);
    profile.rotation.copy(rotation);
    profile.position.set(...face.center).add(new Three.Vector3(0,face.height/2,.0045).applyEuler(rotation));
    profile.receiveShadow=true;
    next.add(profile);
   }
  }
  const sheen = tileAppearance(assetInfo);
  const material = new Three.MeshPhysicalMaterial({
   map:texture(assetInfo.image), bumpMap:micro, bumpScale:.00075 * sheen.roughness,
   roughness:sheen.roughness, clearcoat:sheen.clearcoat, clearcoatRoughness:.29, metalness:0
  });
  const tiledSegments=surface==='wall'?[...segments,...shell.flushButtons]:segments;
  const cover = new Three.Mesh(surfaceGeometry(tiledSegments, format, surface, assetInfo.image, grain, seed), material);
  cover.receiveShadow = true;
  next.add(cover);
  const old = group.children[0];
  if (old) {
   const materials = new Set();
   old.traverse(object => {
    if(object.geometry)object.geometry.dispose();
    if(object.material)materials.add(object.material);
   });
   for(const item of materials)item.dispose();
   group.remove(old);
  }
  group.add(next);
  keys.set(surface, key);
 }
 return {
  draw(context, selection, assets, grouts) {
   for(const surface of ['floor','wall'])updateSurface(surface, selection, assets[surface], grouts[selection[surface+'Grout']].rgb);
   if (!furnished) {
    createFixtures(scene, { oakMap, oakNormal, daylightView });
    renderer.shadowMap.needsUpdate = true;
    furnished = true;
   }
   if(lighting)lighting.render(renderer,scene);
   else renderer.render(scene, camera);
   context.drawImage(canvas, 0, 0);
  }
 };
}
