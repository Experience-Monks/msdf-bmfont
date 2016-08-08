const THREE = require('three');
global.THREE = THREE;
const createTextGeometry = require('three-bmfont-text');
const createMSDFShader = require('./createMSDFShader');
const fontPreloader = require('./fontPreloader');

var cubeMesh, scene, camera, renderer, mesh;

function init () {
  var canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({canvas});
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
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
    font: data.font
  });
  geometry.update('test  text');
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI;
  // mesh.position.z = -130;
  mesh.position.x = -70;
  scene.add(mesh);
});
