import "./style.css";
import { moonInfoText, nicoInfoText } from "./helper/constants";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * This file sets up a Three.js scene with various objects and interactions.
 *
 * - Imports necessary modules and constants.
 * - Initializes the scene, camera, and renderer.
 * - Adds lighting to the scene.
 * - Creates and adds a torus, stars, a textured box, and a textured moon to the scene.
 * - Implements raycasting to detect mouse interactions with the moon object.
 * - Displays information about the moon when it is clicked.
 * - Animates the scene, rotating the torus and moon.
 * - Handles window resize events to adjust the camera and renderer.
 */

const CAMERA_FOV = 75;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_POSITION_Z = 30;
const TORUS_GEOMETRY_PARAMS = [6, 0.7, 2, 20];
const TORUS_COLOR = 0xff6347;
const AXES_HELPER_SIZE = 50;
const POINT_LIGHT_COLOR = 0xffffff;
const POINT_LIGHT_INTENSITY = 15;
const POINT_LIGHT_POSITION = [10, 10, 10];
const AMBIENT_LIGHT_COLOR = 0x404040;
var AMBIENT_LIGHT_INTENSITY = 50;
const GRID_HELPER_SIZE = 200;
const GRID_HELPER_DIVISIONS = 50;
const STAR_COLOR = 0xffffff;
const INITIAL_STAR_COUNT = 300;
const MOON_GEOMETRY_PARAMS = [3, 32, 32];
const MOON_EMISSIVE_COLOR = 0x000000;
const MOON_EMISSIVE_INTENSITY = 0.5;
const MOON_POSITION = [-10, 10, 10];
const HIGHLIGHT_COLOR = 0xfc4e03;
const INFO_DIV_PADDING = 40;
var TORUS_ROTATION_SPEED = { x: 0.0015, y: 0.0005, z: 0.001 };
var MOON_ROTATION_SPEED_Y = 0.002;

const scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR,
  CAMERA_FAR
);

const initialCameraSettings = {
  fov: CAMERA_FOV,
  aspect: window.innerWidth / window.innerHeight,
  near: CAMERA_NEAR,
  far: CAMERA_FAR,
  position: { x: 0, y: 0, z: CAMERA_POSITION_Z },
  rotation: {
    x: camera.rotation.x,
    y: camera.rotation.y,
    z: camera.rotation.z,
  },
};

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(CAMERA_POSITION_Z);

renderer.render(scene, camera);

const gridHelper = new THREE.GridHelper(
  GRID_HELPER_SIZE,
  GRID_HELPER_DIVISIONS
);

const axesHelper = new THREE.AxesHelper(AXES_HELPER_SIZE);
scene.add(axesHelper, gridHelper);

const gridHelperCheckbox = document.getElementById("gridHelperCheckbox");
gridHelperCheckbox.addEventListener("change", (event) => {
  gridHelper.visible = event.target.checked;
});

const axesHelperCheckbox = document.getElementById("axesHelperCheckbox");
axesHelperCheckbox.addEventListener("change", (event) => {
  axesHelper.visible = event.target.checked;
});

// Ensure the helpers are not visible initially
gridHelper.visible = gridHelperCheckbox.checked;
axesHelper.visible = axesHelperCheckbox.checked;

const ambientLight = new THREE.AmbientLight(
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY
);

scene.add(ambientLight);

// Add this after creating the ambient light
const ambientLightSlider = document.getElementById("ambientLightSlider");
ambientLightSlider.addEventListener("input", (event) => {
  const intensity = event.target.value;
  ambientLight.intensity = intensity;
});

// const lightHelper = new THREE.PointLightHelper(pointLight);
// scene.add(lightHelper);

// GEOMETRY
const geometry = new THREE.TorusGeometry(...TORUS_GEOMETRY_PARAMS);
const material = new THREE.MeshStandardMaterial({
  color: TORUS_COLOR,
});
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

let controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < INITIAL_STAR_COUNT; i++) {
    const x = THREE.MathUtils.randFloatSpread(200);
    const y = THREE.MathUtils.randFloatSpread(200);
    const z = THREE.MathUtils.randFloatSpread(200);
    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const starTexture = new THREE.TextureLoader().load("img/star.png");

  const material = new THREE.PointsMaterial({
    color: STAR_COLOR,
    size: 2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    map: starTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.isStar = true;
  scene.add(stars);
}

addStar();

const spaceTexture = new THREE.TextureLoader().load("img/space.jpg");
scene.background = spaceTexture;

const NicoTexture = new THREE.TextureLoader().load("img/nico.jpg");
const nico = new THREE.Mesh(
  new THREE.BoxGeometry(5, 5, 5),
  new THREE.MeshStandardMaterial({ map: NicoTexture })
);
nico.isCheckable = true;

scene.add(nico);

const moonTexture = new THREE.TextureLoader().load("img/moon.jpg");
const normalTexture = new THREE.TextureLoader().load("img/normal.jpg");

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(...MOON_GEOMETRY_PARAMS),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
    emissive: MOON_EMISSIVE_COLOR,
    emissiveIntensity: MOON_EMISSIVE_INTENSITY,
  })
);

moon.position.set(...MOON_POSITION);
moon.isCheckable = true;

scene.add(moon);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;

function updateRaycaster(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
}

function onMouseMove(event) {
  updateRaycaster(event);
  const checkableObjects = scene.children.filter((obj) => obj.isCheckable);
  const intersects = raycaster.intersectObjects(checkableObjects);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED && INTERSECTED.material.emissive) {
        INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      }
      INTERSECTED = intersects[0].object;
      if (INTERSECTED.material.emissive) {
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex(HIGHLIGHT_COLOR);
      }
    }
  } else {
    if (INTERSECTED && INTERSECTED.material.emissive) {
      INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    }
    INTERSECTED = null;
  }
}

function onMouseClick(event) {
  updateRaycaster(event);
  handleClick(event);
}

function onTouchStart(event) {
  event.preventDefault();
  updateRaycaster(event.touches[0]);
}

function onTouchEnd(event) {
  event.preventDefault();
  updateRaycaster(event.changedTouches[0]);
  handleClick(event.changedTouches[0]);
}

function handleClick(event) {
  const checkableObjects = scene.children.filter((obj) => obj.isCheckable);
  const intersects = raycaster.intersectObjects(checkableObjects);

  for (let i = 0; i < intersects.length; i++) {
    switch (intersects[i].object) {
      case moon:
        displayInfo(moon, moonInfoText);
        break;
      case nico:
        displayInfo(nico, nicoInfoText);
        break;
      default:
        console.warn("Unknown object intersected: ", intersects[i].object);
        break;
    }
  }
}

function displayInfo(object, infoText) {
  const existingInfoDiv = document.querySelector(".info-div");
  if (existingInfoDiv) {
    document.body.removeChild(existingInfoDiv);
  }
  const vector = new THREE.Vector3();
  object.getWorldPosition(vector);
  vector.project(camera);
  let x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  let y = (vector.y * -0.5 + 0.5) * window.innerHeight;
  const infoDiv = document.createElement("div");
  infoDiv.className = "info-div";
  infoDiv.innerText = infoText;
  document.body.appendChild(infoDiv);
  const infoDivRect = infoDiv.getBoundingClientRect();
  const padding = INFO_DIV_PADDING;
  if (x - infoDivRect.width / 2 < padding) {
    x = infoDivRect.width / 2 + padding;
  } else if (x + infoDivRect.width / 2 > window.innerWidth - padding) {
    x = window.innerWidth - infoDivRect.width / 2 - padding;
  }
  if (y - infoDivRect.height < padding) {
    y = infoDivRect.height + padding;
  } else if (y > window.innerHeight - padding) {
    y = window.innerHeight - padding;
  }
  infoDiv.style.left = `${x}px`;
  infoDiv.style.top = `${y}px`;
  infoDiv.style.transform = "translate(-50%, -100%)";

  document.addEventListener(
    "click",
    (event) => {
      if (!infoDiv.contains(event.target)) {
        if (document.body.contains(infoDiv)) {
          document.body.removeChild(infoDiv);
        }
      }
    },
    { once: true }
  );

  document.addEventListener(
    "touchstart",
    (event) => {
      if (!infoDiv.contains(event.target)) {
        if (document.body.contains(infoDiv)) {
          document.body.removeChild(infoDiv);
        }
      }
    },
    { once: true }
  );

  requestAnimationFrame(() => {
    infoDiv.classList.add("show");
  });
}

const rotationSpeedSlider = document.getElementById("rotationSpeedSlider");
rotationSpeedSlider.addEventListener("input", (event) => {
  var speed = parseFloat(event.target.value);
  TORUS_ROTATION_SPEED.x = speed;
  TORUS_ROTATION_SPEED.y = speed;
  TORUS_ROTATION_SPEED.z = speed;
  MOON_ROTATION_SPEED_Y = speed;
});

const starCountInput = document.getElementById("starCountInput");
starCountInput.addEventListener("input", (event) => {
  var starCount = parseInt(event.target.value, 10);
  if (starCount > 10000) {
    starCount = 10000;
    starCountInput.value = 10000;
  }
  updateStars(starCount);
});

function updateStars(starCount) {
  // Remove existing stars
  const existingStars = scene.children.filter((obj) => obj.isStar);
  existingStars.forEach((star) => scene.remove(star));

  // Add new stars
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < starCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(200);
    const y = THREE.MathUtils.randFloatSpread(200);
    const z = THREE.MathUtils.randFloatSpread(200);
    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const starTexture = new THREE.TextureLoader().load("img/star.png");

  const material = new THREE.PointsMaterial({
    color: STAR_COLOR,
    size: 2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    map: starTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.isStar = true;
  scene.add(stars);
}

const resetCameraButton = document.getElementById("resetCameraButton");
resetCameraButton.addEventListener("click", () => {
  // Remove the existing camera and controls
  scene.remove(camera);
  controls.dispose();

  // Create a new camera with the initial settings
  camera = new THREE.PerspectiveCamera(
    initialCameraSettings.fov,
    initialCameraSettings.aspect,
    initialCameraSettings.near,
    initialCameraSettings.far
  );
  camera.position.set(
    initialCameraSettings.position.x,
    initialCameraSettings.position.y,
    initialCameraSettings.position.z
  );
  camera.rotation.set(
    initialCameraSettings.rotation.x,
    initialCameraSettings.rotation.y,
    initialCameraSettings.rotation.z
  );

  // Add the new camera to the scene and create new controls
  scene.add(camera);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Ensure the projection matrix is updated
  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);
});

function animate() {
  requestAnimationFrame(animate);
  torus.rotation.x += TORUS_ROTATION_SPEED.x;
  torus.rotation.y += TORUS_ROTATION_SPEED.y;
  torus.rotation.z += TORUS_ROTATION_SPEED.z;
  moon.rotation.y += MOON_ROTATION_SPEED_Y;
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);
window.addEventListener("touchstart", onTouchStart);
window.addEventListener("touchend", onTouchEnd);
