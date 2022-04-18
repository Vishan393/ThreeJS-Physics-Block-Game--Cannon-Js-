////////////////////////////////////////////////////////
// Must Analyse and learn about all the code in depth //
///////////////////////////////////////////////////////

//Adds the Scene
const scene = new THREE.Scene();

// Adds the cube to the scene
const geometry = new THREE.BoxGeometry(3, 1, 3); // Creates box with x = 3, y = 1, x = 3
const material = new THREE.MeshLambertMaterial({ color: 0x66d9e8 }); // Sets material and colour of box (Colour must be hexadecimal)
const mesh = new THREE.Mesh(geometry, material); // Adds the box and matetial together
mesh.position.set(0, 0, 0); // Sets the box position to the center (x,y,x)
scene.add(mesh); // Adds box to scene

// Adds lights to the scene
const ambientLight = new THREE.AmbientLight(0xc5f6fa, 0.6); // Creates light with specified colour and strength from all directions (0 - 1 strength)
// Without Ambient light the front will be dark
scene.add(ambientLight); // Adds light to scene

const directionalLight = new THREE.DirectionalLight(0xc5f6fa, 0.6); // Created directional light
directionalLight.position.set(10, 20, 0); // Sets the position of light source (x,y,x)
// Since the light is coming from above, the top of tyhe box will be the brightest
// Since the light is coming from the right, the right of the box is brighter than the left
scene.add(directionalLight); // Adds light to scene

// Example of Perspective Camera Setup
// const aspect = window.innerHeight / window.innerWidth;  // Keeps aspect ratio of browser
// const camera = new THREE.PerspectiveCamera(
//   20, // vertical field of view (vertical angle from viewport)
//   aspect, // aspect ratio
//   60, // near plane distance from viewport
//   100 // far plane distance from viewport
// );

// Example of Orthographic Camera Setup
// const aspect = window.innerHeight / window.innerWidth;
// const width = 10;
// const height = width / aspect;

// const camera = new THREE.OrthographicCamera( // Position of each plane of the projected surface
//   width / -2, // left
//   width / 2, // right
//   height / 2, // top
//   height / -2, // bottom
//   1, // near plane
//   100 // far plane
// );

// Adds camera to scene
const width = 10;
const height = width * (window.innerHeight / window.innerWidth);
const camera = new THREE.OrthographicCamera(
  width / -2, // left
  width / 2, // right
  height / 2, // top
  height / -2, // bottom
  1, // near plane
  100 // far plane
);

camera.position.set(4, 4, 4); // Sets camera position (x,y,x)
camera.lookAt(0, 0, 0); // Sets position camera looks at (x,y,x)

// Set up renderer
renderer = new THREE.WebGLRenderer({ antialias: true }); // Sets up renderer
renderer.setSize(window.innerWidth, window.innerHeight); // Set size of canvas in relation to browser
renderer.render(scene, camera); // Render scene and camera

// Adds renderer to the HTML
document.body.appendChild(renderer.domElement);
