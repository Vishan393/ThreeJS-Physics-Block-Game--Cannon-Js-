////////////////////////////////////////////////////////
// Must Analyse and learn about all the code in depth //
///////////////////////////////////////////////////////

// Restructured Code with cannon.js
let camera, scene, renderer; // ThreeJS global variables
let world; // CannonJS world

const originalBoxSize = 3; // Original width and height of a box

let stack = [];
let overhangs = [];
const boxHeight = 1; // Height of each layer

init(); // Must call

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Adds the box one layer higher

  const layer = generateBox(x, y, z, width, depth, false); // Box with zero mass (controlled by user)
  layer.direction = direction;

  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); // Adds new box on the same layer
  const overhang = generateBox(x, y, z, width, depth, true); // Box with 5 mass (controlled by CannonJS)
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
  // ThreeJS
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${190 + stack.length * 4}, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  //CannonJS
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2) // Create box in CannonJS
  );
  let mass = falls ? 5 : 0; // Define mass of box
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return {
    threejs: mesh, // property for further reference (mesh is threejs)
    cannonjs: body, // property for further reference (body is cannonjs)
    width,
    depth,
  };
}

function animation() {
  const speed = 0.15;

  const topLayer = stack[stack.length - 1];
  topLayer.threejs.position[topLayer.direction] += speed;
  topLayer.cannonjs.position[topLayer.direction] += speed; // CannonJS update

  // 4 is the initial camera height
  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
  }

  updatePhysics(); // Simulate physics
  renderer.render(scene, camera);
}

// Simulate time passing
function updatePhysics() {
  world.step(1 / 60); // Step the physics world (setAnimationLoop function runs 60 times every second)

  // Copy coordinates from Cannon.js to Three.js (updates positions and orientations in CannonJS to ThreeJS for the ones with mass)
  overhangs.forEach((element) => {
    // LEARN MORE
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}

function init() {
  // Initialize CannonJS
  world = new CANNON.World();
  world.gravity.set(0, -10, 0); // Gravity pulls things down
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  // Initialize ThreeJS
  scene = new THREE.Scene();

  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // First Layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  // Set up lights in scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(10, 20, 0);
  scene.add(directionalLight);

  // Set up camera in scene
  const width = 10;
  const height = width * (window.innerHeight / window.innerWidth);
  camera = new THREE.OrthographicCamera(
    width / -2, // left
    width / 2, // right
    height / 2, // top
    height / -2, // bottom
    1, // near plane
    100 // far plane
  );
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
  document.body.appendChild(renderer.domElement);
}

let gameStarted = false; // Global for status of the game

// Split box event handler and overhanging
window.addEventListener("click", () => {
  if (!gameStarted) {
    renderer.setAnimationLoop(animation);
    gameStarted = true;
  } else {
    // Select the top to boxes in the stack
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    const direction = topLayer.direction;

    const delta =
      topLayer.threejs.position[direction] -
      previousLayer.threejs.position[direction];

    const overhangSize = Math.abs(delta);

    const size = direction == "x" ? topLayer.width : topLayer.depth;

    const overlap = size - overhangSize;

    if (overlap >= 0) {
      ////////// CAN BE MOVED TO ANOTHER FUNCTION ///////////
      //Cut layer
      // const direction = topLayer.direction;
      const newWidth = direction == "x" ? overlap : topLayer.width;
      const newDepth = direction == "z" ? overlap : topLayer.depth;

      // Update the metadata with new values
      topLayer.width = newWidth;
      topLayer.delta = newDepth;

      // Update ThreeJS model (scale then shift)
      topLayer.threejs.scale[direction] = overlap / size; // Scale
      topLayer.threejs.position[direction] -= delta / 2; // Shift

      // Update CannonJS model
      topLayer.cannonjs.position[direction] -= delta / 2;

      // Replace shape to smaller one because in CannonJS you can't scale a shape
      const shape = new CANNON.Box(
        new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
      );
      topLayer.cannonjs.shapes = [];
      topLayer.cannonjs.addShape(shape);
      ////////// CAN BE MOVED TO ANOTHER FUNCTION ///////////

      // Overhanging part
      const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
      const overhangX =
        direction == "x"
          ? topLayer.threejs.position.x + overhangShift
          : topLayer.threejs.position.x;
      const overhangZ =
        direction == "z"
          ? topLayer.threejs.position.z + overhangShift
          : topLayer.threejs.position.z;
      const overhangWidth = direction == "x" ? overhangSize : newWidth;
      const overhangDepth = direction == "z" ? overhangSize : newDepth;

      // Render overhanging box
      addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

      // Next layer
      const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
      const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
      const nextDirection = direction == "x" ? "z" : "x";

      addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    }
  }
});
