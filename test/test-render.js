const THREE = require('three');
global.THREE = THREE;
const createTextGeometry = require('three-bmfont-text');
const createMSDFShader = require('./createMSDFShader');
const fontPreloader = require('./fontPreloader');

let scene, camera, renderer, mesh;

function init () {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  document.body.style.margin = '0';
  document.body.style.overfow = 'hidden';
  document.body.appendChild(canvas);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 250;

  renderer = new THREE.WebGLRenderer({canvas});
  renderer.setClearColor(0xffffff);
  renderer.setPixelRatio(window.devicePixelRatio);
  window.addEventListener('resize', resize);
  resize();
}

function resize () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animate () {
  render();
  window.requestAnimationFrame(animate);
}

function render () {
  renderer.render(scene, camera);
}

init();
animate();

fontPreloader((err, data) => {
  if (err) console.log(err);
  const material = new THREE.RawShaderMaterial(createMSDFShader({
    map: data.texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    color: '#000000'
  }));
  var geometry = createTextGeometry({
    font: data.font,
    width: 300
  });
  geometry.update('The quick brown fox jumped over the lazy dogs.');
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI;
  mesh.position.x = -140;
  mesh.position.y = -100;
  scene.add(mesh);
});
