import * as Three from 'three';

export function createBathLightingPass(width, height, camera, roomLight) {
 const target = new Three.WebGLRenderTarget(width, height, {
  type: Three.HalfFloatType,
  samples:4,
  depthTexture: new Three.DepthTexture(width, height, Three.UnsignedIntType)
 });
 const scene = new Three.Scene();
 const screen = new Three.OrthographicCamera(-1, 1, 1, -1, 0, 1);
 const material = new Three.ShaderMaterial({
  uniforms: {
   roomColor: { value: target.texture },
   roomDepth: { value: target.depthTexture },
   roomLight: { value: roomLight },
   useRoomLight: { value: Boolean(roomLight) },
   unproject: { value: camera.projectionMatrixInverse },
   focal: { value: camera.projectionMatrix.elements[5] },
   inverseSize: { value: new Three.Vector2(1 / width, 1 / height) },
   aspect: { value: width / height }
  },
  depthWrite:false,
  depthTest:false,
  vertexShader: `
   varying vec2 pixel;
   void main() {
    pixel = uv;
    gl_Position = vec4(position.xy, 0., 1.);
   }
  `,
  fragmentShader: `
   varying vec2 pixel;
   uniform sampler2D roomColor;
   uniform sampler2D roomDepth;
   uniform sampler2D roomLight;
   uniform bool useRoomLight;
   uniform mat4 unproject;
   uniform vec2 inverseSize;
   uniform float focal;
   uniform float aspect;

   vec3 viewPosition(vec2 uv, float depth) {
    vec4 at = unproject * vec4(uv * 2. - 1., depth * 2. - 1., 1.);
    return at.xyz / at.w;
   }
   vec3 neighbor(vec2 offset) {
    vec2 at = pixel + offset;
    return viewPosition(at, texture2D(roomDepth, at).r);
   }
   float ambientShadow(vec3 point) {
    vec3 dx1 = neighbor(vec2(inverseSize.x, 0.)) - point;
    vec3 dx2 = point - neighbor(vec2(-inverseSize.x, 0.));
    vec3 dy1 = neighbor(vec2(0., inverseSize.y)) - point;
    vec3 dy2 = point - neighbor(vec2(0., -inverseSize.y));
    vec3 normal = normalize(cross(abs(dx1.z) < abs(dx2.z) ? dx1 : dx2, abs(dy1.z) < abs(dy2.z) ? dy1 : dy2));
    float radius = .37;
    vec2 rangePx = vec2(1. / aspect, 1.) * min(.31, focal * radius / (-2. * point.z));
    float rotation = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) * .7;
    float contact = 0.;
    for (int i = 0; i < 24; i++) {
     float step = float(i);
     float angle = step * 2.39996323 + rotation;
     float ring = sqrt((step + .5) / 24.);
     vec2 uv = pixel + vec2(cos(angle), sin(angle)) * rangePx * ring;
     if (uv.x <= 0. || uv.x >= 1. || uv.y <= 0. || uv.y >= 1.) continue;
     vec3 diff = viewPosition(uv, texture2D(roomDepth, uv).r) - point;
     float dist = length(diff);
     float horizon = max(0., dot(normal, diff) - .003) / max(.001, dist);
     contact += horizon * (1. - smoothstep(.015, radius, dist));
    }
    return min(.32, contact * .100);
   }
   void main() {
    vec3 color = texture2D(roomColor, pixel).rgb;
    float depth = texture2D(roomDepth, pixel).r;
    if (depth < .9999) color *= 1. - ambientShadow(viewPosition(pixel, depth));
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    if (useRoomLight) gl_FragColor.rgb *= exp2(texture2D(roomLight,pixel).r * 2. - 1.);
    #include <colorspace_fragment>
   }
  `
 });
 const quad = new Three.Mesh(new Three.PlaneGeometry(2, 2), material);
 quad.frustumCulled = false;
 scene.add(quad);
 return {
  render(renderer, room) {
   renderer.setRenderTarget(target);
   renderer.render(room, camera);
   renderer.setRenderTarget(null);
   renderer.render(scene, screen);
  }
 };
}
