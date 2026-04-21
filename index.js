/*
Built from Aidan Nelson's week-05-raycasting starter:
https://github.com/AidanNelson/3d-in-the-browser/tree/main/week-05-raycasting

The scene setup, OrbitControls usage, normalized mouse coordinates,
ground raycasting, hover marker behavior, and click-to-place interaction
are adapted from that template. The flower field, grass generation,
lighting, and growth animation are custom for this assignment.
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene;
let camera;
let renderer;
let controls;
let raycaster;
let mouse;
let ground;
let hoverMesh;
let lastFrameTime = 0;

const plantedFlowers = [];
const FIELD_SIZE = 70;

const flowerPalettes = [
  { petals: 0xff7aa2, center: 0xffd34d },
  { petals: 0xff9f68, center: 0xffef96 },
  { petals: 0xf8f8ff, center: 0xf3c748 },
  { petals: 0xc88cff, center: 0xffd95e },
  { petals: 0xff5fc7, center: 0xffd34d },
  { petals: 0xf7e85d, center: 0x8c5b1c },
];

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8ff);
  scene.fog = new THREE.Fog(0xbfe8ff, 40, 115);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 300);
  camera.position.set(0, 16, 24);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.5, 0);
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 10;
  controls.maxDistance = 45;

  addLights();
  ground = createGround();
  scene.add(ground);
  scene.add(createGrassField());

  hoverMesh = createHoverMesh();
  scene.add(hoverMesh);

  mouse = new THREE.Vector2(0, 0);
  raycaster = new THREE.Raycaster();

  document.addEventListener(
    "mousemove",
    (ev) => {
      // Adapted from the class starter: convert the cursor into
      // normalized device coordinates before raycasting from camera.
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersections = raycaster.intersectObject(ground);

      if (intersections[0]) {
        const pointInSpace = intersections[0].point;
        hoverMesh.position.set(pointInSpace.x, pointInSpace.y + 0.04, pointInSpace.z);
        hoverMesh.visible = true;
      } else {
        hoverMesh.visible = false;
      }
    },
    false
  );

  document.addEventListener("pointerdown", () => {
    // Adapted from the class starter: raycast onto the ground and
    // place an object wherever the click intersects the field.
    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObject(ground);

    if (intersections[0]) {
      const pointInSpace = intersections[0].point.clone();
      const flower = createFlower(pointInSpace);
      plantedFlowers.push(flower);
      scene.add(flower.group);
    }
  });

  window.addEventListener("resize", onWindowResize);

  renderLoop();
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xf4fbff, 0x6ba85e, 1.8);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2c4, 2.2);
  sun.position.set(14, 28, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  scene.add(sun);
}

function createGround() {
  const geometry = new THREE.BoxGeometry(FIELD_SIZE, 0.5, FIELD_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color: 0x72c85b,
    roughness: 0.95,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.25;
  mesh.receiveShadow = true;
  return mesh;
}

function createGrassField() {
  const bladeGeometry = new THREE.ConeGeometry(0.05, 0.9, 5);
  bladeGeometry.translate(0, 0.45, 0);

  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f8f3c,
    roughness: 1,
  });

  const count = 1800;
  const instancedGrass = new THREE.InstancedMesh(bladeGeometry, bladeMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const x = THREE.MathUtils.randFloatSpread(FIELD_SIZE - 4);
    const z = THREE.MathUtils.randFloatSpread(FIELD_SIZE - 4);
    const height = THREE.MathUtils.randFloat(0.7, 1.45);

    dummy.position.set(x, 0, z);
    dummy.rotation.set(
      THREE.MathUtils.randFloat(-0.12, 0.12),
      Math.random() * Math.PI,
      THREE.MathUtils.randFloat(-0.12, 0.12)
    );
    dummy.scale.set(
      THREE.MathUtils.randFloat(0.8, 1.25),
      height,
      THREE.MathUtils.randFloat(0.8, 1.25)
    );
    dummy.updateMatrix();
    instancedGrass.setMatrixAt(i, dummy.matrix);
  }

  instancedGrass.castShadow = true;
  instancedGrass.receiveShadow = true;
  return instancedGrass;
}

function createHoverMesh() {
  const group = new THREE.Group();

  const outerRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe36b,
    transparent: true,
    opacity: 0.75,
  });
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.05, 12, 48),
    outerRingMaterial
  );
  outerRing.rotation.x = Math.PI / 2;
  group.add(outerRing);

  const innerRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.05, 12, 36),
    innerRingMaterial
  );
  innerRing.rotation.x = Math.PI / 2;
  group.add(innerRing);

  const glowDiscMaterial = new THREE.MeshBasicMaterial({
    color: 0xffef99,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.52, 32), glowDiscMaterial);
  glowDisc.rotation.x = -Math.PI / 2;
  glowDisc.position.y = 0.01;
  group.add(glowDisc);

  const beaconMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff0a8,
    transparent: true,
    opacity: 0.32,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.14, 1.4, 16, 1, true), beaconMaterial);
  beacon.position.y = 0.72;
  group.add(beacon);

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff1a6,
      emissive: 0xc79500,
      emissiveIntensity: 0.55,
    })
  );
  center.position.y = 0.18;
  group.add(center);

  group.userData = {
    outerRing,
    outerRingMaterial,
    innerRing,
    innerRingMaterial,
    glowDisc,
    glowDiscMaterial,
    beacon,
    beaconMaterial,
    center,
  };
  group.visible = false;
  return group;
}

function createFlower(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const palette = flowerPalettes[Math.floor(Math.random() * flowerPalettes.length)];
  const stemHeight = THREE.MathUtils.randFloat(1.2, 2.2);
  const petalCount = THREE.MathUtils.randInt(6, 9);
  const bloomRadius = THREE.MathUtils.randFloat(0.28, 0.45);
  const targetScale = THREE.MathUtils.randFloat(0.9, 1.35);
  const leftLeafBaseScale = new THREE.Vector3(1.4, 0.45, 0.9);
  const rightLeafBaseScale = new THREE.Vector3(1.3, 0.42, 0.9);

  const stemGeometry = new THREE.CylinderGeometry(0.06, 0.08, stemHeight, 10);
  stemGeometry.translate(0, stemHeight * 0.5, 0);
  const stem = new THREE.Mesh(
    stemGeometry,
    new THREE.MeshStandardMaterial({ color: 0x2b8d3d, roughness: 0.95 })
  );
  stem.castShadow = true;
  group.add(stem);

  const leafGeometry = new THREE.SphereGeometry(0.18, 10, 10);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4ea84f, roughness: 0.95 });

  const leftLeaf = new THREE.Mesh(leafGeometry, leafMaterial);
  leftLeaf.position.set(-0.18, stemHeight * 0.45, 0);
  leftLeaf.scale.copy(leftLeafBaseScale);
  leftLeaf.rotation.z = Math.PI / 4;
  group.add(leftLeaf);

  const rightLeaf = new THREE.Mesh(leafGeometry, leafMaterial);
  rightLeaf.position.set(0.2, stemHeight * 0.65, 0);
  rightLeaf.scale.copy(rightLeafBaseScale);
  rightLeaf.rotation.z = -Math.PI / 4;
  group.add(rightLeaf);

  const flowerHead = new THREE.Group();
  flowerHead.position.y = stemHeight;
  group.add(flowerHead);

  const petalGeometry = new THREE.SphereGeometry(0.22, 14, 14);
  const petalMaterial = new THREE.MeshStandardMaterial({
    color: palette.petals,
    roughness: 0.82,
  });

  for (let i = 0; i < petalCount; i += 1) {
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    const angle = (i / petalCount) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * bloomRadius, 0, Math.sin(angle) * bloomRadius);
    petal.scale.set(1.05, 0.55, 0.8);
    flowerHead.add(petal);
  }

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 18),
    new THREE.MeshStandardMaterial({
      color: palette.center,
      roughness: 0.8,
      emissive: palette.center,
      emissiveIntensity: 0.08,
    })
  );
  center.scale.set(1.15, 0.7, 1.15);
  flowerHead.add(center);

  group.rotation.y = Math.random() * Math.PI * 2;
  group.scale.setScalar(targetScale);
  stem.scale.set(1, 0.02, 1);
  leftLeaf.scale.setScalar(0.001);
  rightLeaf.scale.setScalar(0.001);
  flowerHead.scale.setScalar(0.001);
  flowerHead.position.y = 0.06;

  return {
    group,
    stem,
    flowerHead,
    leftLeaf,
    rightLeaf,
    stemHeight,
    targetScale,
    growth: 0,
    growthSpeed: THREE.MathUtils.randFloat(0.5, 0.82),
    leftLeafBaseScale,
    rightLeafBaseScale,
    swayOffset: Math.random() * Math.PI * 2,
  };
}

function animateFlowers(time, deltaSeconds) {
  for (const flower of plantedFlowers) {
    flower.growth = Math.min(1, flower.growth + deltaSeconds * flower.growthSpeed);

    const stemProgress = smoothProgress(flower.growth, 0, 0.48);
    const leafProgress = smoothProgress(flower.growth, 0.26, 0.68);
    const bloomProgress = smoothProgress(flower.growth, 0.55, 1);
    const bloomPop = easeOutBack(bloomProgress);

    flower.group.scale.setScalar(flower.targetScale);
    flower.stem.scale.set(1, Math.max(stemProgress, 0.02), 1);
    flower.flowerHead.position.y = flower.stemHeight * stemProgress;
    flower.flowerHead.scale.setScalar(Math.max(bloomPop, 0.001));
    flower.flowerHead.rotation.y = time * 0.8 + flower.swayOffset;

    flower.leftLeaf.scale.set(
      Math.max(flower.leftLeafBaseScale.x * leafProgress, 0.001),
      Math.max(flower.leftLeafBaseScale.y * leafProgress, 0.001),
      Math.max(flower.leftLeafBaseScale.z * leafProgress, 0.001)
    );
    flower.rightLeaf.scale.set(
      Math.max(flower.rightLeafBaseScale.x * leafProgress, 0.001),
      Math.max(flower.rightLeafBaseScale.y * leafProgress, 0.001),
      Math.max(flower.rightLeafBaseScale.z * leafProgress, 0.001)
    );

    const swayStrength = 0.01 + stemProgress * 0.03;
    flower.group.rotation.z = Math.sin(time * 1.4 + flower.swayOffset) * swayStrength;
  }
}

function renderLoop(time = 0) {
  const seconds = time * 0.001;
  const deltaSeconds = lastFrameTime === 0 ? 1 / 60 : Math.min(seconds - lastFrameTime, 0.05);
  lastFrameTime = seconds;

  controls.update();
  animateFlowers(seconds, deltaSeconds);

  if (hoverMesh.visible) {
    animateHoverMesh(seconds);
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(renderLoop);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateHoverMesh(time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 4.8);
  const quickPulse = 0.5 + 0.5 * Math.sin(time * 8.5);
  const hoverParts = hoverMesh.userData;

  hoverMesh.rotation.y += 0.03;
  hoverMesh.position.y = 0.04 + Math.sin(time * 5.5) * 0.05;

  hoverParts.center.position.y = 0.18 + Math.sin(time * 7) * 0.05;
  hoverParts.outerRing.scale.setScalar(1 + pulse * 0.35);
  hoverParts.innerRing.scale.setScalar(0.92 + quickPulse * 0.14);
  hoverParts.glowDisc.scale.setScalar(1 + pulse * 0.18);
  hoverParts.beacon.scale.y = 0.8 + quickPulse * 0.4;
  hoverParts.beacon.position.y = 0.55 + hoverParts.beacon.scale.y * 0.35;

  hoverParts.outerRingMaterial.opacity = 0.35 + pulse * 0.45;
  hoverParts.innerRingMaterial.opacity = 0.45 + quickPulse * 0.45;
  hoverParts.glowDiscMaterial.opacity = 0.18 + pulse * 0.18;
  hoverParts.beaconMaterial.opacity = 0.14 + quickPulse * 0.22;
}

function smoothProgress(value, start, end) {
  return THREE.MathUtils.smoothstep(value, start, end);
}

function easeOutBack(value) {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}
