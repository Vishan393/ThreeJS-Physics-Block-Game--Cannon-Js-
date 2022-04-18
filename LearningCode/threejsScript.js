////////////////////////////////////////////////////////
// Must Analyse and learn about all the code in depth //
///////////////////////////////////////////////////////

// Restructured Code of setting up box
let camera, scene, renderer; // ThreeJS global variables
const originalBoxSize = 3; // Original width and height of a box

let stack = [];
let overhangs = [];
const boxHeight = 1; // Height of each layer

init(); // Must call

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Adds the box one layer higher

  const layer = generateBox(x, y, z, width, depth);
  layer.direction = direction;

  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); // Adds new box on the same layer
  const overhang = generateBox(x, y, z, width, depth);
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);

  const color = new THREE.Color(`hsl(${190 + stack.length * 4}, 100%, 50%)`); // This changes the colour of the boxes like a gradient. It starts at a hue of 30 degrees and adds 4 degress each time a box is added. The 100% is the saturation and the 50% is the lightness.
  const material = new THREE.MeshLambertMaterial({ color });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);

  scene.add(mesh);

  return {
    threejs: mesh, // property for further reference (mesh is threejs)
    width,
    depth,
  };
}

function animation() {
  const speed = 0.15; // Sets speed

  const topLayer = stack[stack.length - 1]; // Pick the top-level stack item.
  topLayer.threejs.position[topLayer.direction] += speed; // Direction will be x or z. Increase the position by a bit. /////////// LEARN MORE

  // 4 is the initial camera height
  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
    // If camera is still in frame we don't move it
  }
  renderer.render(scene, camera); // Re-render whole scene with every animation loop. NEED THIS LINE TO UPDATE
}

function init() {
  scene = new THREE.Scene();

  // Foundation
  // We added the first box as the foundation and then add the first layer off the screen that will move when the game is started
  addLayer(0, 0, originalBoxSize, originalBoxSize); // Code generating box was moved into addLayer() function
  // The parameters for the function is the x and z for the box as the y is calculated automatically by the function. We also need width and depth (originalBoxSize)
  // As the game progresses, the width and depth will be smaller but the first 2 will be the same size. The height is constant
  // The fifth parameter will be the direction the box will come from (x or z)

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

// OLD EVENT HANDLER
// window.addEventListener("click", () => {
//   // Add evenet listener for clicking on the screen to start the game. Then checks to see if the screen is clicked to add box. It will stop the box and add a layer.
//   // It starts the animation by passing on a callback to the setAnimationLoop method of the renderer (similar to requestAnimationFrame in JavaScript). The difference is you don't have to keep calling this to have a loop like requestAnimationFrame. setAnimationLoop keeps running until stopped explicitly
//   if (!gameStarted) {
//     renderer.setAnimationLoop(animation);
//     gameStarted = true;
//   } else {
//     const topLayer = stack[stack.length - 1]; // Chooses the top layer
//     const direction = topLayer.direction;

//     // Next layer
//     const nextX = direction == "x" ? 0 : -10;
//     const nextZ = direction == "z" ? 0 : -10;
//     const newWidth = originalBoxSize;
//     const newDepth = originalBoxSize;
//     const nextDirection = direction == "x" ? "z" : "x"; // If direction is z the next is x and vice-versa. If direction equals z, set direction to z. If direction equalds z, set direction to x.

//     addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
//   }
// });

// Split box event handler and overhanging
/////////// LEARN MORE ///////////
window.addEventListener("click", () => {
  if (!gameStarted) {
    renderer.setAnimationLoop(animation);
    gameStarted = true;
  } else {
    // Select the top to boxes in the stack
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    const direction = topLayer.direction;

    // The distance between the middle of the 2 boxes after clicking (delta). This will be the same size as the absolute value of the overhanging part
    const delta =
      topLayer.threejs.position[direction] -
      previousLayer.threejs.position[direction];

    const overhangSize = Math.abs(delta);

    // The size of the box depending if it is moving along the x-axis and the z-axis
    const size = direction == "x" ? topLayer.width : topLayer.depth;

    // The overlap is the size of the box - the overhanging
    const overlap = size - overhangSize;

    // If the overlap is greater than or equal to 0, this is the code to display the new box. If the overlap is less than 0, you lose the game and the animation loop ends
    if (overlap >= 0) {
      //Cut layer
      // Depending on which axis the box is moving on, one value of the width/depth will stay the same while the other value will be the overlap.
      const newWidth = direction == "x" ? overlap : topLayer.width;
      const newDepth = direction == "z" ? overlap : topLayer.depth;

      // Update the metadata with new values
      topLayer.width = newWidth;
      topLayer.delta = newDepth;

      // Update ThreeJS model (scale then shift)
      // In ThreeJS we must scale the box (can't just put in new values) to the proportion of the new and old size. Move the same box over the last box. Right now since we scaled the box, it can be over the edit and not fully overlap the previous box like in the game. We must move the box over half of delta to fix this.
      topLayer.threejs.scale[direction] = overlap / size; // Scale
      topLayer.threejs.position[direction] -= delta / 2; // Shift

      // Overhanging part
      // The overhangShift is half of the overlap and the overhangSize. Depending when the click happens, this value will always be positive but to determine which way it shifts we must multiply it by the sign of delta (-1 or 1). If the click happens too later then we have to subtract the 2 values instead of adding, this makes things complicated so we multiply by delat instead to fix this.
      const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
      // Calculates the positon of the overhanging box by getting either the x or z position, depending on direction of box, and adding overhangShift
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
      // We adjust the position of the box depending on the position of the last box. One position will always be -10 depending on the x and z of the box. The other will be the position of the last box. Depending on the last direction.
      const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
      const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
      const nextDirection = direction == "x" ? "z" : "x";

      addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    }
  }
});
