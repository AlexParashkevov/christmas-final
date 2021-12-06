import "./css/style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as CANNON from "cannon-es";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { PointerLockControlsCannon } from "cannon-es/examples/js/PointerLockControlsCannon.js";
import Proton, { ScreenZone } from "three.proton.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";

import * as Stats from "stats.js";
// console.log(Proton);
// sound
if (screen.width < 1024) {
  // console.log("no load");
  document.querySelector(".legend").style.display = "none";
  document.querySelector(".loaderbg").style.display = "none";
  document.querySelector(".mobile").style.display = "flex";
} else {
  const hitSound = new Audio("./assets/music.mp3");
  const playHitSound = () => {
    hitSound.volume = 0.1;
    hitSound.currentTime = 0;
    hitSound.play();
  };
  let camera, scene, renderer, stats;
  let material;
  let soundPlaying = false;
  let soundDom = false;
  let onGift = false;
  let snow = true;
  let mute = false;
  let timeStarted = false;

  // cannon.js variables
  let world;
  let controls;
  const timeStep = 1 / 60;
  let lastCallTime = performance.now();
  let sphereShape;
  let sphereBody;
  let foundAll = false;
  let physicsMaterial;
  let collideWall = false;
  let controlsLive = false;
  const fullscreenElement =
    document.fullscreenElement || document.webkitFullscreenElement;
  let score = 0;
  const balls = [];
  const ballMeshes = [];
  const boxes = [];
  const boxMeshes = [];
  const decorPositions = [
    [-32, 3, -12],
    [0.056, 4.88, 1.439],
    [35.551, 2.162, 15.363],
    [-0.004, 2.162, -3.88],
    [-1.84, 0.653, -1.556],
    [-44.664, 1.508, 23.858],
    [-16.016, 1.983, 3.189],
    [-13.36, 2.562, -25.238],
    [31.205, 2.562, -14.191],
    [5.398, 1.625, -0.319],
    [3.236, 0.719, 3.602],
    [-3.04, 1.625, 41.653],
    [-23.071, 1.625, 26.044],
    [20.481, 1.625, 21.78],
    [-21.94, 1.625, 5.795],
    [11.231, 1.625, -14.033],
    [-6.611, 1.625, 9.724],
    [-19.718, 1.625, -14.132],
    [-24.506, 1.625, 44.237],
    [37.185, 1.625, 18.45],
  ];
  const instructions = document.getElementById("instructions");
  const play = document.querySelector(".play");
  world = new CANNON.World();
  //

  //
  let sceneReady = false;
  const loadingBarElement = document.querySelector(".loading-bar");
  const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
      // Wait a little
      window.setTimeout(() => {
        // Update loadingBarElement
        loadingBarElement.classList.add("ended");
        loadingBarElement.style.transform = "";
      }, 500);
      window.setTimeout(() => {
        sceneReady = true;
      }, 3000);
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
      // Calculate the progress and update the loadingBarElement
      const progressRatio = itemsLoaded / itemsTotal;
      loadingBarElement.style.transform = `scaleX(${progressRatio})`;
    }
  );

  // function initThree() {
  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);
  // camera.layers.enable(1);

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00000, 0.05);
  // Renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaFactor = 2.2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(1);
  renderer.autoClear = false;

  // Post processing
  let RenderTargetClass = null;
  if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
    RenderTargetClass = THREE.WebGLMultisampleRenderTarget;
  } else {
    RenderTargetClass = THREE.WebGLRenderTarget;
  }
  const renderTarget = new RenderTargetClass(800, 600, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding,
  });
  const effectComposer = new EffectComposer(renderer, renderTarget);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  effectComposer.setSize(window.innerWidth, window.innerHeight);

  const renderPass = new RenderPass(scene, camera);
  effectComposer.addPass(renderPass);

  const unrealBloomPass = new UnrealBloomPass();
  unrealBloomPass.enabled = true;
  unrealBloomPass.strength = 0.8;
  unrealBloomPass.radius = 0.1;
  unrealBloomPass.threshold = 0.01;
  unrealBloomPass.renderToScreen = true;

  effectComposer.addPass(unrealBloomPass);
  document.body.appendChild(renderer.domElement);
  effectComposer.setPixelRatio(1);

  // fire
  let textureLoader = new THREE.TextureLoader();

  // Stats.js
  // stats = new Stats();
  // document.body.appendChild(stats.dom);
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);
  const light = new THREE.PointLight(0xffe566, 0.5, 6);
  light.position.set(1.5, 3, -0.2);
  scene.add(light);
  const light2 = new THREE.PointLight(0xffe566, 0.5, 15);
  light2.position.set(-7.8, 7, 2.5);
  scene.add(light2);
  // const light3 = new THREE.PointLight(0xffe566, 0.5, 5);
  // light3.position.set(0, 3, 8);
  // scene.add(light3);
  // const sphereSize = 1;
  // const pointLightHelper = new THREE.PointLightHelper(light, sphereSize);
  // scene.add(pointLightHelper);

  // Generic material
  material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

  // gltf

  var loader = new GLTFLoader(loadingManager);
  let worldModel = null;
  let mixer = null;
  let menuClosed = false;
  let BuyBestGift = null;
  let tehnadGift = null;
  let gift1 = null;
  let sock = null;
  let treeSmall = null;
  let cane = null;
  let christmasLogo = null;
  let giftInteract = null;
  let outlineMaterial2 = null;
  let outlineMesh2 = null;
  let outlineMaterial3 = null;
  let outlineMesh3 = null;
  let outlineMaterial4 = null;
  let outlineMesh4 = null;
  let outlineMaterial5 = null;
  let outlineMesh5 = null;
  let outlineMaterial6 = null;
  let outlineMesh6 = null;
  let outlineMaterial7 = null;
  let outlineMesh7 = null;
  let outlineMaterial8 = null;
  let outlineMesh8 = null;
  let wall1 = null;
  let wall2 = null;
  let outlineMaterial9 = null;
  let outlineMesh9 = null;
  let outlineMaterial10 = null;
  let outlineMesh10 = null;
  let outlineMaterial11 = null;
  let outlineMesh11 = null;
  let outlineMaterialNanny = null;
  let outlineMeshNanny = null;
  let nannyGift = null;
  let outlineMaterialDS = null;
  let outlineMeshDS = null;
  let dalsiatGift = null;
  let wall3 = null;
  let webandGift = null;
  let webandGift2 = null;
  let doorLeft = null;
  let doorRight = null;
  let gifts = [];
  let decor1 = null;
  let decor2 = null;
  let decor1found = false;
  let decor2found = false;
  let decor3 = null;
  let decor4 = null;
  let decor3found = false;
  let decor4found = false;
  let decor5 = null;
  let decor5found = false;
  let wbspin;
  let dsspin;
  let bbspin;
  let thspin;
  let soundon = null;
  let soundoff = null;
  // Load a glTF resource
  loader.load(
    // resource URL
    "./assets/testChristmas.glb",
    // called when the resource is loaded
    function (gltf) {
      // scene.add(gltf.scene);
      worldModel = gltf.scene;
      gltf.animations; // Array<THREE.AnimationClip>
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (let i = 0; i < gltf.animations.length; i++) {
        let action = mixer.clipAction(gltf.animations[i]);
        action.play();
      }
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object
      // geometry = new THREE.Geometry().fromBufferGeometry(worldModel.geometry);
      // console.log(worldModel);
      scene.add(worldModel);
      worldModel.traverse(function (child) {
        if (child.isMesh) {
          // console.log(child.name);
          // if (child.name === "buybestGift") {
          //   BuyBestGift = child;
          // }
          if (child.name === "sock") {
            sock = child;
            sock.visible = false;
          } else if (child.name === "christmast-logo") {
            christmasLogo = child;
            christmasLogo.visible = false;
          } else if (child.name === "cane") {
            cane = child;
            cane.visible = false;
          } else if (child.name === "treeSmall") {
            treeSmall = child;
            treeSmall.visible = false;
          }
          // } else if (child.name === "giftInteract") {
          //   giftInteract = child;
          //   gifts.push(giftInteract);
          //   outlineMaterial2 = new THREE.MeshBasicMaterial({
          //     color: 0xf4e404,
          //     side: THREE.BackSide,
          //   });
          //   outlineMesh2 = new THREE.Mesh(
          //     giftInteract.geometry,
          //     outlineMaterial2
          //   );
          //   outlineMesh2.position.copy(giftInteract.position);
          //   outlineMesh2.rotation.copy(giftInteract.rotation);
          //   outlineMesh2.scale.multiplyScalar(1.05);
          //   scene.add(outlineMesh2);
          //   outlineMesh2.visible = false;
          // } else if (child.name === "CashExpGift") {
          //   cashExpGift = child;
          //   gifts.push(cashExpGift);
          //   outlineMaterial3 = new THREE.MeshBasicMaterial({
          //     color: 0xcb2424,
          //     side: THREE.BackSide,
          //   });
          //   outlineMesh3 = new THREE.Mesh(cashExpGift.geometry, outlineMaterial3);
          //   outlineMesh3.position.copy(cashExpGift.position);
          //   outlineMesh3.rotation.copy(cashExpGift.rotation);
          //   outlineMesh3.scale.multiplyScalar(1.05);
          //   scene.add(outlineMesh3);
          //   outlineMesh3.visible = false;
          // } else if (child.name === "dalsiatGift") {
          //   dalsiatGift = child;
          //   gifts.push(dalsiatGift);
          //   outlineMaterial4 = new THREE.MeshBasicMaterial({
          //     color: 0x049444,
          //     side: THREE.BackSide,
          //   });
          //   outlineMesh4 = new THREE.Mesh(dalsiatGift.geometry, outlineMaterial4);
          //   outlineMesh4.position.copy(dalsiatGift.position);
          //   outlineMesh4.position.y = -2.25;
          //   outlineMesh4.rotation.copy(dalsiatGift.rotation);
          //   outlineMesh4.scale.multiplyScalar(1.05);
          //   scene.add(outlineMesh4);
          //   outlineMesh4.visible = false;
          // }
          else if (child.name === "weband-gift") {
            webandGift = child;
            gifts.push(webandGift);
            outlineMaterial5 = new THREE.MeshBasicMaterial({
              color: 0x720bab,
            });
            outlineMesh5 = new THREE.Mesh(
              webandGift.geometry,
              outlineMaterial5
            );
            outlineMesh5.position.copy(webandGift.position);
            outlineMesh5.rotation.copy(webandGift.rotation);
            outlineMesh5.scale.multiplyScalar(1.01);
            outlineMesh5.position.x += 0.01;

            scene.add(outlineMesh5);
            outlineMesh5.visible = false;
          }
          // else if (child.name === "weband-gift2") {
          //   webandGift2 = child;
          //   gifts.push(webandGift2);
          //   outlineMaterial6 = new THREE.MeshBasicMaterial({
          //     color: 0x720bab,
          //     // side: THREE.BackSide,
          //   });
          //   outlineMesh6 = new THREE.Mesh(webandGift2.geometry, outlineMaterial6);
          //   outlineMesh6.position.copy(webandGift2.position);
          //   // console.log(outlineMesh6.position);
          //   outlineMesh6.rotation.copy(webandGift2.rotation);
          //   outlineMesh6.scale.multiplyScalar(1.02);
          //   scene.add(outlineMesh6);
          //   outlineMesh6.visible = false;
          // }
          else if (child.name === "buybest-present") {
            BuyBestGift = child;
            gifts.push(BuyBestGift);
            outlineMaterial10 = new THREE.MeshBasicMaterial({
              color: 0x0437f2,
            });
            outlineMesh10 = new THREE.Mesh(
              BuyBestGift.geometry,
              outlineMaterial10
            );
            outlineMesh10.position.copy(BuyBestGift.position);
            // console.log(outlineMesh6.position);
            outlineMesh10.rotation.copy(BuyBestGift.rotation);
            outlineMesh10.scale.multiplyScalar(1.02);
            scene.add(outlineMesh10);
            outlineMesh10.visible = false;
          } else if (child.name === "tehnad-present") {
            tehnadGift = child;
            gifts.push(tehnadGift);
            outlineMaterial11 = new THREE.MeshBasicMaterial({
              color: 0xfbc30b,
            });
            outlineMesh11 = new THREE.Mesh(
              tehnadGift.geometry,
              outlineMaterial11
            );
            outlineMesh11.position.copy(tehnadGift.position);
            // console.log(outlineMesh6.position);
            outlineMesh11.rotation.copy(tehnadGift.rotation);
            // outlineMesh11.scale.multiplyScalar(1.02);
            outlineMesh11.position.x += 0.01;

            scene.add(outlineMesh11);
            outlineMesh11.visible = false;
          } else if (child.name === "dalsiat-present") {
            dalsiatGift = child;
            gifts.push(dalsiatGift);
            outlineMaterialDS = new THREE.MeshBasicMaterial({
              color: 0x1d683f,
            });
            outlineMeshDS = new THREE.Mesh(
              dalsiatGift.geometry,
              outlineMaterialDS
            );
            outlineMeshDS.position.copy(dalsiatGift.position);
            // console.log(outlineMesh6.position);
            outlineMeshDS.rotation.copy(dalsiatGift.rotation);
            // outlineMesh11.scale.multiplyScalar(1.02);
            outlineMeshDS.position.x += 0.01;

            scene.add(outlineMeshDS);
            outlineMeshDS.visible = false;
          } else if (child.name === "nanny-present") {
            nannyGift = child;
            gifts.push(nannyGift);
            outlineMaterialNanny = new THREE.MeshBasicMaterial({
              color: 0xa53a89,
            });
            outlineMeshNanny = new THREE.Mesh(
              nannyGift.geometry,
              outlineMaterialNanny
            );
            outlineMeshNanny.position.copy(nannyGift.position);
            // console.log(outlineMesh6.position);
            outlineMeshNanny.rotation.copy(nannyGift.rotation);
            // outlineMeshNanny.scale.multiplyScalar(1.01);
            outlineMeshNanny.position.x += 0.01;
            scene.add(outlineMeshNanny);
            outlineMeshNanny.visible = false;
          } else if (child.name === "wall1") {
            wall1 = child;
            gifts.push(wall1);
            outlineMaterial7 = new THREE.MeshBasicMaterial({
              color: 0xff0000,
            });
            outlineMesh7 = new THREE.Mesh(wall1.geometry, outlineMaterial7);
            outlineMesh7.position.copy(wall1.position);
            outlineMesh7.position.x = wall1.position.x + 0.1;
            outlineMesh7.rotation.copy(wall1.rotation);
            outlineMesh7.scale.multiplyScalar(1.1);
            scene.add(outlineMesh7);
            outlineMesh7.visible = false;
          } else if (child.name === "wall2") {
            wall2 = child;
            gifts.push(wall2);
            outlineMaterial8 = new THREE.MeshBasicMaterial({
              color: 0xff0000,
            });
            outlineMesh8 = new THREE.Mesh(wall2.geometry, outlineMaterial8);
            outlineMesh8.position.copy(wall2.position);
            outlineMesh8.position.x = wall2.position.x + 0.1;
            outlineMesh8.rotation.copy(wall2.rotation);
            outlineMesh8.scale.multiplyScalar(1.1);
            scene.add(outlineMesh8);
            outlineMesh8.visible = false;
          } else if (child.name === "wall3") {
            wall3 = child;
            gifts.push(wall3);
            outlineMaterial9 = new THREE.MeshBasicMaterial({
              color: 0xff0000,
            });
            outlineMesh9 = new THREE.Mesh(wall3.geometry, outlineMaterial9);
            outlineMesh9.position.copy(wall3.position);
            outlineMesh9.position.x = wall3.position.x + 0.1;
            outlineMesh9.rotation.copy(wall3.rotation);
            outlineMesh9.scale.multiplyScalar(1.1);
            scene.add(outlineMesh9);
            outlineMesh9.visible = false;
          } else if (child.name === "door-left") {
            doorLeft = child;
          } else if (child.name === "door-right") {
            doorRight = child;
          } else if (child.name === "decor1") {
            decor1 = child;
            let theRandomNumber =
              Math.floor(Math.random() * decorPositions.length) + 0;
            // console.log(theRandomNumber);
            const pos = new THREE.Vector3().fromArray(
              decorPositions.splice(theRandomNumber, 1)[0]
            );
            decor1.position.copy(pos);
            // console.log(pos);
            // console.log(decor1.position);
            gifts.push(decor1);
          } else if (child.name === "decor2") {
            decor2 = child;
            let theRandomNumber =
              Math.floor(Math.random() * decorPositions.length) + 0;
            // console.log(theRandomNumber);

            const pos = new THREE.Vector3().fromArray(
              decorPositions.splice(theRandomNumber, 1)[0]
            );
            // console.log(pos);

            decor2.position.copy(pos);
            gifts.push(decor2);
          } else if (child.name === "decor3") {
            decor3 = child;
            let theRandomNumber =
              Math.floor(Math.random() * decorPositions.length) + 0;
            // console.log(theRandomNumber);

            const pos = new THREE.Vector3().fromArray(
              decorPositions.splice(theRandomNumber, 1)[0]
            );
            // console.log(pos);

            decor3.position.copy(pos);
            gifts.push(decor3);
          } else if (child.name === "decor4") {
            decor4 = child;
            let theRandomNumber =
              Math.floor(Math.random() * decorPositions.length) + 0;
            // console.log(theRandomNumber);

            const pos = new THREE.Vector3().fromArray(
              decorPositions.splice(theRandomNumber, 1)[0]
            );
            // console.log(pos);

            decor4.position.copy(pos);
            gifts.push(decor4);
          } else if (child.name === "decor5") {
            decor5 = child;
            let theRandomNumber =
              Math.floor(Math.random() * decorPositions.length) + 0;
            // console.log(theRandomNumber);

            const pos = new THREE.Vector3().fromArray(
              decorPositions.splice(theRandomNumber, 1)[0]
            );
            // console.log(pos);

            decor5.position.copy(pos);
            gifts.push(decor5);
            // } else if (child.name === "weband-logo") {
            //   wbspin = child;
            // }
          } else if (child.name === "dalsiat-logo") {
            dsspin = child;
          } else if (child.name === "buybest-logo") {
            bbspin = child;
          } else if (child.name === "tehnad-logo") {
            thspin = child;
          } else if (child.name === "soundoff") {
            soundoff = child;
            gifts.push(soundoff);
            soundoff.visible = false;
          } else if (child.name === "soundon") {
            soundon = child;
            gifts.push(soundon);
          }
        }
      });
      initCannon();
      initPointerLock();
      animate();
      document.querySelector(".loaderbg").style.display = "none";
      document.querySelector(".legend").style.display = "block";
    },
    // called while loading is progressing
    function (xhr) {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    }
    // called when loading has errors
  );
  window.addEventListener("resize", onWindowResize);
  // }
  // const raycaster = new THREE.Raycaster();
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  let canvas = document.querySelector("BODY");
  //
  function initPointerLock() {
    controls = new PointerLockControlsCannon(camera, sphereBody);
    scene.add(controls.getObject());

    play.addEventListener("click", () => {
      controlsLive = true;
      camera.position.set(0, 0, 0);
      doorLeft.visible = false;
      doorRight.visible = false;
      controls.lock();
      document.querySelector(".cursor").style.display = "block";
      document.querySelector(".esc").style.display = "flex";
      document.querySelector(".player-time").style.display = "flex";
      document.querySelector(".score").style.display = "flex";
      if (!soundDom) {
        playHitSound();
        soundDom = true;
        hitSound.play();
        soundPlaying = true;
      } else if (soundDom && !mute) {
        hitSound.play();
        soundPlaying = true;
      }
      if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
          canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
          canvas.webkitRequestFullscreen();
        }
      }
    });

    controls.addEventListener("lock", () => {
      controls.enabled = true;
      instructions.style.display = "none";
      menuClosed = true;
    });

    controls.addEventListener("unlock", () => {
      if (!mousedown) {
        controls.enabled = false;
        menuClosed = false;
        if (!mute) {
          console.log(mute);
          hitSound.pause();
        }

        instructions.style.display = "flex";
        document.querySelector(".cursor").style.display = "none";
        controlsLive = false;
        document.querySelector(".buybest-text").style.top = "-100vh";
        document.querySelector(".cashExp-text").style.top = "-100vh";
        document.querySelector(".dalsiat-text").style.top = "-100vh";
        document.querySelector(".weband-text").style.top = "-100vh";
        document.querySelector(".tehnad-text").style.top = "-100vh";
        document.querySelector(".nanny-text").style.top = "-100vh";
        document.querySelector(".gotoweb").style.top = "-100vh";
        document.querySelector(".esc").style.display = "none";
        document.querySelector(".player-time").style.display = "none";
        document.querySelector(".score").style.display = "none";
        // if (document.exitFullscreen) {
        //   document.exitFullscreen();
        // } else if (document.webkitExitFullscreen) {
        //   document.webkitExitFullscreen();
        // }
      }
    });
  }
  //
  // const finalPass = new ShaderPass(
  //   new THREE.ShaderMaterial({
  //     uniforms: {
  //       baseTexture: { value: null },
  //       bloomTexture: { value: bloomComposer.renderTarget2.texture },
  //     },
  //     vertexShader: document.getElementById("vertexshader").textContent,
  //     fragmentShader: document.getElementById("fragmentshader").textContent,
  //     defines: {},
  //   }),
  //   "baseTexture"
  // );
  // finalPass.needsSwap = true;

  // const finalComposer = new EffectComposer(renderer);
  // finalComposer.addPass(renderScene);
  // finalComposer.addPass(finalPass);
  // function getCursorDirection() {
  //   const vector = new THREE.Vector3(0, 0, 1);
  //   vector.unproject(camera);
  //   const ray = new THREE.Ray(
  //     sphereBody.position,
  //     vector.sub(sphereBody.position).normalize()
  //   );
  //   console.log(ray.direction);
  // }

  const raycaster = new THREE.Raycaster();
  const lock = new THREE.Vector3(0, 0, 1);
  //
  var onMouseDown2 = function (event) {
    document.querySelector(".cashExp-text").style.top = "-100vh";
    document.querySelector(".dalsiat-text").style.top = "-100vh";
    document.querySelector(".buybest-text").style.top = "50%";
    document.querySelector(".cursor").style.display = "none";
  };
  var onMouseDown = function (event) {
    // console.log("click");
    document.querySelector(".buybest-text").style.top = "-100vh";
    document.querySelector(".dalsiat-text").style.top = "-100vh";
    document.querySelector(".weband-text").style.top = "-100vh";
    document.querySelector(".tehnad-text").style.top = "-100vh";
    document.querySelector(".cashExp-text").style.top = "50%";
    document.querySelector(".cursor").style.display = "none";
  };
  var onMouseDown3 = function (event) {
    document.querySelector(".buybest-text").style.top = "-100vh";
    document.querySelector(".cashExp-text").style.top = "-100vh";
    document.querySelector(".weband-text").style.top = "-100vh";
    document.querySelector(".tehnad-text").style.top = "-100vh";
    document.querySelector(".dalsiat-text").style.top = "50%";
    document.querySelector(".cursor").style.display = "none";
  };
  let mousedown = false;
  let btnClose = false;
  var onMouseDown4 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      mousedown = true;
      document.exitPointerLock();

      controls.enabled = false;
      instructions.style.display = "none";
      // controlsLive = false;
      // console.log("clicked");

      document.querySelector(".buybest-text").style.top = "-100vh";
      document.querySelector(".cashExp-text").style.top = "-100vh";
      document.querySelector(".dalsiat-text").style.top = "-100%";
      document.querySelector(".weband-text").style.top = "50%";
      document.querySelector(".wrapper").style.top = "0vh";
      document.querySelector(".cursor").style.display = "none";
      // if (document.exitFullscreen) {
      //   document.exitFullscreen();
      // } else if (document.webkitExitFullscreen) {
      //   document.webkitExitFullscreen();
      // }
      menuClosed = false;
      controlsLive = false;
    }
  };
  var tehnadMouseDown = function (e) {
    if (menuClosed) {
      e.preventDefault();
      mousedown = true;
      document.exitPointerLock();

      controls.enabled = false;
      instructions.style.display = "none";
      // controlsLive = false;
      // console.log("clicked");

      document.querySelector(".buybest-text").style.top = "-100vh";
      document.querySelector(".cashExp-text").style.top = "-100vh";
      document.querySelector(".dalsiat-text").style.top = "-100%";
      document.querySelector(".tehnad-text").style.top = "50%";
      document.querySelector(".wrapper").style.top = "0vh";
      document.querySelector(".cursor").style.display = "none";
      // if (document.exitFullscreen) {
      //   document.exitFullscreen();
      // } else if (document.webkitExitFullscreen) {
      //   document.webkitExitFullscreen();
      // }
      menuClosed = false;
      controlsLive = false;
    }
  };
  var nannyMouseDown = function (e) {
    if (menuClosed) {
      e.preventDefault();
      mousedown = true;
      document.exitPointerLock();

      controls.enabled = false;
      instructions.style.display = "none";
      // controlsLive = false;
      // console.log("clicked");

      document.querySelector(".buybest-text").style.top = "-100vh";
      document.querySelector(".cashExp-text").style.top = "-100vh";
      document.querySelector(".tehnad-text").style.top = "-100vh";
      document.querySelector(".nanny-text").style.top = "50%";
      document.querySelector(".wrapper").style.top = "0vh";
      document.querySelector(".cursor").style.display = "none";
      // if (document.exitFullscreen) {
      //   document.exitFullscreen();
      // } else if (document.webkitExitFullscreen) {
      //   document.webkitExitFullscreen();
      // }
      menuClosed = false;
      controlsLive = false;
    }
  };

  // document.querySelector(".close2").addEventListener("click", () => {
  //   console.log("closed");
  //   btnClose = true;
  //   controls.lock();
  //   controlsLive = true;
  //   document.querySelector(".cursor").style.display = "block";
  //   document.querySelector(".gotoweb").style.top = "-100vh";
  //   document.querySelector(".weband-text").style.top = "-100vh";
  //   controls.enabled = true;
  //   mousedown = false;
  // });
  var onMouseDown5 = function (e) {
    if (menuClosed) {
      mousedown = true;
      document.exitPointerLock();
      controls.enabled = false;
      instructions.style.display = "none";
      e.preventDefault();

      // console.log("fire");
      // window.open("https://www.weband.bg/");
      document.querySelector(".gotoweb").style.top = "50%";
      document.querySelector(".cursor").style.display = "none";
    }
  };
  var onMouseDown6 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      // console.log("clicked on decor");
      if (!decor1found) {
        score += 1;
        onGift = true;
        decor1.position.set(-9.006, 2.053, 2.798);
        decor1.scale.set(0.5, 0.5, 0.5);
        // console.log(decor1.position);
        if (!timeStarted) {
          timeStarted = true;
        }
        decor1found = true;
      }
    }
  };
  var onMouseDown7 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      // console.log("clicked on decor2");
      if (!decor2found) {
        score += 1;
        onGift = true;
        decor2.position.set(-8.93, 2.228, 4.89);
        decor2.scale.set(0.5, 0.5, 0.5);
        if (!timeStarted) {
          timeStarted = true;
        }
        // console.log(decor2.position);
        decor2found = true;
      }
    }
  };
  var onMouseDown8 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      // console.log("clicked on decor3");
      if (!decor3found) {
        score += 1;
        onGift = true;
        decor3.position.set(-8.159, 1.521, 3.463);
        decor3.rotation.y = Math.PI * 1;
        decor3.scale.set(0.5, 0.5, 0.5);
        if (!timeStarted) {
          timeStarted = true;
        }
        // console.log(decor3.position);
        decor3found = true;
      }
    }
  };
  var onMouseDown9 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      // console.log("clicked on decor4");
      if (!decor4found) {
        score += 1;
        onGift = true;
        decor4.position.set(-8.531, 3.206, 3.574);
        decor4.rotation.y = Math.PI * 1;

        decor4.scale.set(0.5, 0.5, 0.5);
        if (!timeStarted) {
          timeStarted = true;
        }
        // console.log(decor4.position);
        decor4found = true;
      }
    }
  };
  var onMouseDown10 = function (e) {
    if (menuClosed) {
      e.preventDefault();
      // console.log("clicked on decor5");
      if (!decor5found) {
        score += 1;
        onGift = true;
        decor5.position.set(-8.835, 4.212, 4.129);
        decor5.scale.set(0.5, 0.5, 0.5);
        decor5.rotation.y = Math.PI * 0.5;
        if (!timeStarted) {
          timeStarted = true;
        }
        // console.log(decor5.position);
        decor5found = true;
      }
    }
  };
  var soundOn = function (e) {
    if (menuClosed) {
      e.preventDefault();
      console.log("sound off");
      soundPlaying = false;
      mute = true;
      hitSound.pause();
      soundon.visible = false;
      soundoff.visible = true;
    }
  };
  var soundOff = function (e) {
    if (menuClosed) {
      e.preventDefault();
      console.log("sound play");
      soundPlaying = true;
      mute = false;
      hitSound.play();
      soundon.visible = true;
      soundoff.visible = false;
    }
  };
  var onMouseDownClose = function (event) {
    // if (menuClosed) {
    event.preventDefault();

    btnClose = true;
    controls.lock();
    controlsLive = true;
    onGift = false;
    document.querySelector(".cursor").style.display = "block";
    document.querySelector(".gotoweb").style.top = "-100vh";
    document.querySelector(".weband-text").style.top = "-100vh";
    document.querySelector(".tehnad-text").style.top = "-100vh";
    document.querySelector(".nanny-text").style.top = "-100vh";
    document.querySelector(".wrapper").style.top = "-100vh";
    document.querySelector(".found-text").style.top = "-100vh";
    controls.enabled = true;
    mousedown = false;
    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      }
    }
    console.log("closed");
    console.log(controls);
    console.log(controlsLive);
    // }
  };
  let elementsArr = document.querySelectorAll(".close");
  let wrapper = document.querySelector(".wrapper");
  let itemClose = null;
  elementsArr.forEach((item) => {
    itemClose = item;
    itemClose.addEventListener("click", onMouseDownClose, false);
  });
  wrapper.addEventListener("click", (e) => {
    e.preventDefault();
    // console.log("clicked on wrapper");
    btnClose = true;
    controls.lock();
    controlsLive = true;
    document.querySelector(".cursor").style.display = "block";
    document.querySelector(".gotoweb").style.top = "-100vh";
    document.querySelector(".weband-text").style.top = "-100vh";
    document.querySelector(".tehnad-text").style.top = "-100vh";
    document.querySelector(".nanny-text").style.top = "-100vh";
    document.querySelector(".found-text").style.top = "-100vh";
    controls.enabled = true;
    mousedown = false;
    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      }
    }
    if (
      decor1found &&
      decor2found &&
      decor3found &&
      decor4found &&
      decor5found
    ) {
      foundAll = true;
      document.querySelector(".wrapper").style.top = "-100vh";
    }
  });
  let proton;
  let emitter;
  let materialSnow;
  function addProton() {
    proton = new Proton();

    emitter = new Proton.Emitter();
    emitter.rate = new Proton.Rate(
      new Proton.Span(10, 10),
      new Proton.Span(0.02, 0.05)
    );
    emitter.addInitialize(new Proton.Mass(1.5));
    emitter.addInitialize(new Proton.Radius(new Proton.Span(0.4, 0.4)));

    var position = new Proton.Position();
    position.addZone(new Proton.BoxZone(10, 10, 10));
    emitter.addInitialize(position);

    emitter.addInitialize(new Proton.Life(4, 4));
    emitter.addInitialize(new Proton.Body(createSnow()));
    emitter.addInitialize(
      new Proton.Velocity(0, new Proton.Vector3D(0, -1, 0), 90)
    );

    emitter.addBehaviour(new Proton.RandomDrift(10, 1, 10, 0.05));
    emitter.addBehaviour(new Proton.Rotate("random", "random"));
    emitter.addBehaviour(new Proton.Gravity(0.4));

    emitter.p.x = 0;
    emitter.p.y = 100;
    emitter.emit();

    proton.addEmitter(emitter);
    proton.addRender(new Proton.SpriteRender(scene));
  }

  function createSnow() {
    var map = new THREE.TextureLoader().load("./assets/snow.png");
    materialSnow = new THREE.SpriteMaterial({
      map: map,
      transparent: true,
      opacity: 0.5,
      color: 0xffffff,
    });
    return new THREE.Sprite(materialSnow);
  }
  addProton();
  const clock = new THREE.Clock();
  let previousTime = 0;

  function animate() {
    // stats.begin();
    raycaster.setFromCamera(lock, camera);
    const time = performance.now() / 1000;
    const dt = time - lastCallTime;

    controls.update(dt);
    if (timeStarted) {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - previousTime;
      previousTime = elapsedTime;
      var minutes = Math.floor(previousTime / 60);
      let minString = String(minutes);
      var secondsBefore = (previousTime - minutes * 60).toFixed(2);
      let seconds = secondsBefore.split(".")[0];
      let miliseconds = secondsBefore.split(".")[1];
      if (seconds.length == 1) {
        seconds = "0" + seconds;
      }
      if (minString.length == 1) {
        minString = "0" + minString;
      }
      document.querySelector(".time-sec").innerHTML = seconds;
      document.querySelector(".player-time").style.width = "320px";
      document.querySelector(".time-min").innerHTML = minString;
      document.querySelector(".time-mil").innerHTML = miliseconds;
    }

    if (mixer !== null) {
      mixer.update(dt);
    }
    lastCallTime = time;
    if (controls.enabled) {
      world.step(timeStep, dt);

      // Update ball positions
      for (let i = 0; i < balls.length; i++) {
        ballMeshes[i].position.copy(balls[i].position);
        ballMeshes[i].quaternion.copy(balls[i].quaternion);
        if (balls.length > 20) {
          scene.remove(ballMeshes.shift());
          // balls.shift();
          world.removeBody(balls.shift());
        }
      }

      // Update box positions
      for (let i = 0; i < boxes.length; i++) {
        boxMeshes[i].position.copy(boxes[i].position);
        boxMeshes[i].quaternion.copy(boxes[i].quaternion);
      }
    }
    if (
      decor1found &&
      decor2found &&
      decor3found &&
      decor4found &&
      decor5found
    ) {
      // console.log("all gifts found");
      clock.stop();
      if (menuClosed && !foundAll) {
        mousedown = true;
        document.exitPointerLock();
        controls.enabled = false;
        instructions.style.display = "none";
        document.querySelector(".found-text").style.top = "50%";
        document.querySelector(".wrapper").style.top = "0vh";

        document.querySelector(".cursor").style.display = "none";
        foundAll = true;
      }
    }
    // outlineMesh2.visible = false;
    // outlineMesh3.visible = false;
    // outlineMesh4.visible = false;
    outlineMesh5.visible = false;
    // outlineMesh6.visible = false;
    outlineMesh7.visible = false;
    outlineMesh8.visible = false;
    outlineMesh9.visible = false;
    outlineMesh10.visible = false;
    outlineMesh11.visible = false;
    outlineMeshNanny.visible = false;
    outlineMeshDS.visible = false;

    if (!decor1found) decor1.rotation.y += 0.01;
    if (!decor2found) decor2.rotation.y += 0.01;
    if (!decor3found) decor3.rotation.y += 0.01;
    if (!decor4found) decor4.rotation.y += 0.01;
    if (!decor5found) decor5.rotation.y += 0.01;
    onGift = false;
    // wbspin.rotation.y += 0.01;
    dsspin.rotation.y += 0.01;
    bbspin.rotation.y += 0.01;
    thspin.rotation.y += 0.01;
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousedown", onMouseDown2);
    window.removeEventListener("mousedown", onMouseDown3);
    window.removeEventListener("mousedown", onMouseDown4);
    window.removeEventListener("mousedown", onMouseDown5);
    window.removeEventListener("mousedown", onMouseDown6);
    window.removeEventListener("mousedown", onMouseDown7);
    window.removeEventListener("mousedown", onMouseDown8);
    window.removeEventListener("mousedown", onMouseDown9);
    window.removeEventListener("mousedown", onMouseDown10);
    window.removeEventListener("mousedown", tehnadMouseDown);
    window.removeEventListener("mousedown", nannyMouseDown);
    window.removeEventListener("mousedown", soundOn);
    window.removeEventListener("mousedown", soundOff);
    const intersects = raycaster.intersectObjects(gifts);
    // if (collideWall) {
    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].distance < 5) {
        if (intersects[i].object.name === "CashExpGift") {
          outlineMesh3.visible = true;
          onGift = true;
          window.addEventListener("mousedown", onMouseDown, false);
        } else if (intersects[i].object.name === "giftInteract") {
          outlineMesh2.visible = true;
          onGift = true;
          window.addEventListener("mousedown", onMouseDown2, false);
        } else if (intersects[i].object.name === "dalsiatGift") {
          outlineMesh4.visible = true;
          onGift = true;
          window.addEventListener("mousedown", onMouseDown3, false);
        } else if (intersects[i].object.name === "weband-gift") {
          outlineMesh5.visible = true;
          // console.log("hello");

          onGift = true;
          // window.addEventListener("mousedown", onMouseDown4, false);
        } else if (intersects[i].object.name === "buybest-present") {
          outlineMesh10.visible = true;
          // console.log("hello");

          onGift = true;
          window.addEventListener("mousedown", onMouseDown4, false);
        } else if (intersects[i].object.name === "tehnad-present") {
          outlineMesh11.visible = true;
          // console.log("hello");

          onGift = true;
          window.addEventListener("mousedown", tehnadMouseDown, false);
        } else if (intersects[i].object.name === "nanny-present") {
          outlineMeshNanny.visible = true;
          // console.log("hello");

          onGift = true;
          window.addEventListener("mousedown", nannyMouseDown, false);
        } else if (intersects[i].object.name === "dalsiat-present") {
          outlineMeshDS.visible = true;
          // console.log("hello");

          onGift = true;
          window.addEventListener("mousedown", tehnadMouseDown, false);
        } else if (intersects[i].object.name === "wall1") {
          outlineMesh7.visible = true;
          onGift = true;
        } else if (intersects[i].object.name === "wall2") {
          outlineMesh8.visible = true;
          onGift = true;
        } else if (intersects[i].object.name === "wall3") {
          outlineMesh9.visible = true;
          onGift = true;
          window.addEventListener("mousedown", onMouseDown5, false);
        } else if (intersects[i].object.name === "decor1") {
          if (!decor1found) {
            // console.log("found gift");
            onGift = true;

            window.addEventListener("mousedown", onMouseDown6, false);
          }
        } else if (intersects[i].object.name === "decor2") {
          if (!decor2found) {
            // console.log("found gift");

            onGift = true;

            window.addEventListener("mousedown", onMouseDown7, false);
          }
        } else if (intersects[i].object.name === "decor3") {
          if (!decor3found) {
            onGift = true;

            window.addEventListener("mousedown", onMouseDown8, false);
          }
        } else if (intersects[i].object.name === "decor4") {
          if (!decor4found) {
            // console.log("found gift");
            if (!timeStarted) {
              timeStarted = true;
            }
            onGift = true;

            window.addEventListener("mousedown", onMouseDown9, false);
          }
        } else if (intersects[i].object.name === "decor5") {
          if (!decor5found) {
            // console.log("found gift");

            onGift = true;

            window.addEventListener("mousedown", onMouseDown10, false);
          }
        } else if (intersects[i].object.name === "soundon") {
          if (soundPlaying) {
            onGift = true;
            window.addEventListener("mousedown", soundOn, false);
          }
        } else if (intersects[i].object.name === "soundoff") {
          if (!soundPlaying) {
            onGift = true;
            window.addEventListener("mousedown", soundOff, false);
          }
        }
      }
    }
    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].distance < 1) {
        if (intersects[i].object.name === "decor1") {
          onGift = true;
          if (menuClosed) {
            // console.log("clicked on decor");
            if (!decor1found) {
              score += 1;
              onGift = true;
              decor1.position.set(-9.006, 2.053, 2.798);
              decor1.scale.set(0.5, 0.5, 0.5);
              // console.log(decor1.position);
              if (!timeStarted) {
                timeStarted = true;
              }
              decor1found = true;
            }
          }
        } else if (intersects[i].object.name === "decor2") {
          onGift = true;
          if (menuClosed) {
            // console.log("clicked on decor");
            if (!decor2found) {
              score += 1;
              onGift = true;
              decor2.position.set(-8.93, 2.228, 4.89);

              decor2.scale.set(0.5, 0.5, 0.5);
              // console.log(decor1.position);
              if (!timeStarted) {
                timeStarted = true;
              }
              decor2found = true;
            }
          }
        } else if (intersects[i].object.name === "decor3") {
          onGift = true;
          if (menuClosed) {
            // console.log("clicked on decor");
            if (!decor3found) {
              score += 1;
              onGift = true;
              decor3.position.set(-8.159, 1.521, 3.463);
              decor3.rotation.y = Math.PI * 1;

              decor3.scale.set(0.5, 0.5, 0.5);
              // console.log(decor1.position);
              if (!timeStarted) {
                timeStarted = true;
              }
              decor3found = true;
            }
          }
        } else if (intersects[i].object.name === "decor4") {
          onGift = true;
          if (menuClosed) {
            // console.log("clicked on decor");
            if (!decor4found) {
              score += 1;
              onGift = true;
              decor4.position.set(-8.531, 3.206, 3.574);
              decor4.rotation.y = Math.PI * 1;
              decor4.scale.set(0.5, 0.5, 0.5);
              // console.log(decor1.position);
              if (!timeStarted) {
                timeStarted = true;
              }
              decor4found = true;
            }
          }
        } else if (intersects[i].object.name === "decor5") {
          onGift = true;
          if (menuClosed) {
            // console.log("clicked on decor");
            if (!decor5found) {
              score += 1;
              onGift = true;
              decor5.position.set(-8.835, 4.212, 4.129);
              decor5.scale.set(0.5, 0.5, 0.5);
              decor5.rotation.y = Math.PI * 0.5;
              // console.log(decor1.position);
              if (!timeStarted) {
                timeStarted = true;
              }
              decor5found = true;
            }
          }
        }
      }
    }
    if (
      sphereBody.position.z < 11 &&
      sphereBody.position.z > -2 &&
      sphereBody.position.x < 5.4 &&
      sphereBody.position.x > -12.5
    ) {
      snow = false;
      materialSnow.visible = false;
    } else {
      snow = true;
      materialSnow.visible = true;
    }
    document.querySelector(".score-active").innerHTML = score;
    // console.log(onGift);

    requestAnimationFrame(animate);
    // stats.end();
    effectComposer.render();
    if (snow) {
      renderSnow();
    }
  }
  function renderSnow() {
    proton.update();
    // renderer.render(scene, camera);
    // controlCamera();
    // Proton.Debug.renderInfo(proton, 3);
  }

  //
  //
  // PHYSICS
  //
  //
  //
  function initCannon() {
    // world.allowSleep = true;
    // Tweak contact properties.
    // Contact stiffness - use to make softer/harder contacts
    world.defaultContactMaterial.contactEquationStiffness = 1e9;

    // Stabilization time in number of timesteps
    world.defaultContactMaterial.contactEquationRelaxation = 4;
    // walls collision
    const phongMaterial = new THREE.MeshPhongMaterial();
    // railing
    const wallRight = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 2, 16),
      phongMaterial
    );
    wallRight.position.set(-4.3, 4, 3);
    // scene.add(wallRight);

    const WallShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 8));
    const WallRightBody = new CANNON.Body({ mass: 0 });
    WallRightBody.addShape(WallShape, new CANNON.Vec3());
    WallRightBody.position.x = wallRight.position.x;
    WallRightBody.position.y = wallRight.position.y;
    WallRightBody.position.z = wallRight.position.z;
    world.addBody(WallRightBody);
    //
    // bounds
    const wallBound1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(150, 20, 0.1),
      phongMaterial
    );
    wallBound1.position.set(0, 0, 45);
    // scene.add(wallBound1);

    const WallBound1Box = new CANNON.Box(new CANNON.Vec3(75, 10, 0.1));
    const WallBodyBound1 = new CANNON.Body({ mass: 0 });
    WallBodyBound1.addShape(WallBound1Box, new CANNON.Vec3());
    WallBodyBound1.position.x = wallBound1.position.x;
    WallBodyBound1.position.y = wallBound1.position.y;
    WallBodyBound1.position.z = wallBound1.position.z;
    world.addBody(WallBodyBound1);
    // bounds
    const wallBound2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(150, 20, 0.1),
      phongMaterial
    );
    wallBound2.position.set(0, 0, -30);
    // scene.add(wallBound2);

    const WallBound2Box = new CANNON.Box(new CANNON.Vec3(75, 10, 0.1));
    const WallBodyBound2 = new CANNON.Body({ mass: 0 });
    WallBodyBound2.addShape(WallBound2Box, new CANNON.Vec3());
    WallBodyBound2.position.x = wallBound2.position.x;
    WallBodyBound2.position.y = wallBound2.position.y;
    WallBodyBound2.position.z = wallBound2.position.z;
    world.addBody(WallBodyBound2);
    // bounds
    const wallBound3 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 20, 150),
      phongMaterial
    );
    wallBound3.position.set(-50, 0, 0);
    // scene.add(wallBound3);

    const WallBound3Box = new CANNON.Box(new CANNON.Vec3(0.1, 10, 75));
    const WallBodyBound3 = new CANNON.Body({ mass: 0 });
    WallBodyBound3.addShape(WallBound3Box, new CANNON.Vec3());
    WallBodyBound3.position.x = wallBound3.position.x;
    WallBodyBound3.position.y = wallBound3.position.y;
    WallBodyBound3.position.z = wallBound3.position.z;
    world.addBody(WallBodyBound3);
    // bounds
    const wallBound4 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 20, 150),
      phongMaterial
    );
    wallBound4.position.set(42, 0, 0);
    // scene.add(wallBound4);

    const WallBound4Box = new CANNON.Box(new CANNON.Vec3(0.1, 10, 75));
    const WallBodyBound4 = new CANNON.Body({ mass: 0 });
    WallBodyBound4.addShape(WallBound4Box, new CANNON.Vec3());
    WallBodyBound4.position.x = wallBound4.position.x;
    WallBodyBound4.position.y = wallBound4.position.y;
    WallBodyBound4.position.z = wallBound4.position.z;
    world.addBody(WallBodyBound4);
    // bounds
    //
    // railing small
    const Railing2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2, 2, 0.1),
      phongMaterial
    );
    Railing2.position.set(-3, 4.7, 6.5);
    // scene.add(Railing2);

    const RailingShape2 = new CANNON.Box(new CANNON.Vec3(1, 1, 0.1));
    const RailingBody2 = new CANNON.Body({ mass: 0 });
    RailingBody2.addShape(RailingShape2, new CANNON.Vec3());
    RailingBody2.position.x = Railing2.position.x;
    RailingBody2.position.y = Railing2.position.y;
    RailingBody2.position.z = Railing2.position.z;
    world.addBody(RailingBody2);
    // railing small 2
    const Railing3 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 2, 2.6),
      phongMaterial
    );
    Railing3.position.set(-1.5, 4.7, 7.8);
    // scene.add(Railing3);

    const RailingShape3 = new CANNON.Box(new CANNON.Vec3(0.1, 1, 1.3));
    const RailingBody3 = new CANNON.Body({ mass: 0 });
    RailingBody3.addShape(RailingShape3, new CANNON.Vec3());
    RailingBody3.position.x = Railing3.position.x;
    RailingBody3.position.y = Railing3.position.y;
    RailingBody3.position.z = Railing3.position.z;
    world.addBody(RailingBody3);
    //
    // wall right end
    //
    // wall left
    const wallLeft = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.2, 10, 13.8),
      phongMaterial
    );
    wallLeft.position.set(4.1, 1, 4.5);
    // scene.add(wallLeft);
    const WallShape2 = new CANNON.Box(new CANNON.Vec3(0.1, 5, 6.9));
    const WallRightBody2 = new CANNON.Body({ mass: 0 });
    WallRightBody2.addShape(WallShape2, new CANNON.Vec3());
    WallRightBody2.position.x = wallLeft.position.x;
    WallRightBody2.position.y = wallLeft.position.y;
    WallRightBody2.position.z = wallLeft.position.z;
    world.addBody(WallRightBody2);
    //
    // wall frontal
    const wallFrontal = new THREE.Mesh(
      new THREE.BoxBufferGeometry(6, 5, 0.1),
      phongMaterial
    );
    wallFrontal.position.set(0, 6.5, 12.8);
    // scene.add(wallFrontal);
    const WallShapeFrontal = new CANNON.Box(new CANNON.Vec3(3, 2.5, 0.1));
    const WallBodyFrontal = new CANNON.Body({ mass: 0 });
    WallBodyFrontal.addShape(WallShapeFrontal, new CANNON.Vec3());
    WallBodyFrontal.position.x = wallFrontal.position.x;
    WallBodyFrontal.position.y = wallFrontal.position.y;
    WallBodyFrontal.position.z = wallFrontal.position.z;
    world.addBody(WallBodyFrontal);
    //
    // wall left end
    //
    // stairs start
    const Stair1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2, 2, 6),
      material
    );
    Stair1.position.set(-3, 0, 8);
    // scene.add(Stair1);
    const StairShape1 = new CANNON.Box(new CANNON.Vec3(1, 1, 3));
    const StairBody1 = new CANNON.Body({ mass: 0 });
    StairBody1.addShape(StairShape1, new CANNON.Vec3());
    StairBody1.position.x = Stair1.position.x;
    StairBody1.position.y = Stair1.position.y;
    StairBody1.position.z = Stair1.position.z;
    StairBody1.quaternion.setFromEuler(Math.PI / -4, 0, 0);
    world.addBody(StairBody1);
    //
    const Stair2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2, 0.1, 2),
      material
    );
    Stair2.position.set(-3, 3, 11);
    // scene.add(Stair2);
    const StairShape2 = new CANNON.Box(new CANNON.Vec3(1, 0.1, 1));
    const StairBody2 = new CANNON.Body({ mass: 0 });
    StairBody2.addShape(StairShape2, new CANNON.Vec3());
    StairBody2.position.x = Stair2.position.x;
    StairBody2.position.y = Stair2.position.y;
    StairBody2.position.z = Stair2.position.z;
    world.addBody(StairBody2);
    //
    const Stair3 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2, 0.1, 3),
      material
    );
    Stair3.position.set(-0.8, 3.4, 11);
    // scene.add(Stair3);
    const StairShape3 = new CANNON.Box(new CANNON.Vec3(1, 0.1, 1.5));
    const StairBody3 = new CANNON.Body({ mass: 0 });
    StairBody3.addShape(StairShape3, new CANNON.Vec3());
    StairBody3.position.x = Stair3.position.x;
    StairBody3.position.y = Stair3.position.y;
    StairBody3.position.z = Stair3.position.z;
    // StairBody3.quaternion.setFromEuler(Math.PI / -4, 0, 0);
    world.addBody(StairBody3);
    // stairs end
    //
    // second floor
    const SecondFloor = new THREE.Mesh(
      new THREE.BoxBufferGeometry(5, 0.1, 14),
      material
    );
    SecondFloor.position.set(2.5, 4, 4.5);
    // scene.add(SecondFloor);
    const SecondFloorShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.1, 7));
    const SecondFloorBody = new CANNON.Body({ mass: 0 });
    SecondFloorBody.addShape(SecondFloorShape, new CANNON.Vec3());
    SecondFloorBody.position.x = SecondFloor.position.x;
    SecondFloorBody.position.y = SecondFloor.position.y;
    SecondFloorBody.position.z = SecondFloor.position.z;
    world.addBody(SecondFloorBody);
    // second floor 2
    const SecondFloor2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(4, 0.1, 10),
      material
    );
    SecondFloor2.position.set(-2, 4, 1.5);
    // scene.add(SecondFloor2);
    const SecondFloorShape2 = new CANNON.Box(new CANNON.Vec3(2, 0.1, 5));
    const SecondFloorBody2 = new CANNON.Body({ mass: 0 });
    SecondFloorBody2.addShape(SecondFloorShape2, new CANNON.Vec3());
    SecondFloorBody2.position.x = SecondFloor2.position.x;
    SecondFloorBody2.position.y = SecondFloor2.position.y;
    SecondFloorBody2.position.z = SecondFloor2.position.z;
    world.addBody(SecondFloorBody2);
    //
    // second floor 3
    const SecondFloor3 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1.5, 0.1, 2.4),
      material
    );
    SecondFloor3.position.set(-0.75, 4, 7.7);
    // scene.add(SecondFloor3);
    const SecondFloorShape3 = new CANNON.Box(new CANNON.Vec3(0.75, 0.1, 1.2));
    const SecondFloorBody3 = new CANNON.Body({ mass: 0 });
    SecondFloorBody3.addShape(SecondFloorShape3, new CANNON.Vec3());
    SecondFloorBody3.position.x = SecondFloor3.position.x;
    SecondFloorBody3.position.y = SecondFloor3.position.y;
    SecondFloorBody3.position.z = SecondFloor3.position.z;
    world.addBody(SecondFloorBody3);
    //
    // second floor 4
    const SecondFloor4 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(8, 0.1, 1.0),
      material
    );
    SecondFloor4.position.set(-1, 4, 12.0);
    // scene.add(SecondFloor4);
    const SecondFloorShape4 = new CANNON.Box(new CANNON.Vec3(4, 0.1, 0.5));
    const SecondFloorBody4 = new CANNON.Body({ mass: 0 });
    SecondFloorBody4.addShape(SecondFloorShape4, new CANNON.Vec3());
    SecondFloorBody4.position.x = SecondFloor4.position.x;
    SecondFloorBody4.position.y = SecondFloor4.position.y;
    SecondFloorBody4.position.z = SecondFloor4.position.z;
    world.addBody(SecondFloorBody4);
    //
    // wall fireplace
    const wallF = new THREE.Mesh(
      new THREE.BoxBufferGeometry(14, 20, 0.1),
      phongMaterial
    );
    wallF.position.set(-3, 1, -2.5);
    // scene.add(wallF);

    const WallShape3 = new CANNON.Box(new CANNON.Vec3(7, 10, 0.1));
    const WallRightBody3 = new CANNON.Body({ mass: 0 });
    WallRightBody3.addShape(WallShape3, new CANNON.Vec3());
    WallRightBody3.position.x = wallF.position.x;
    WallRightBody3.position.y = wallF.position.y;
    WallRightBody3.position.z = wallF.position.z;
    world.addBody(WallRightBody3);
    // wall 5
    const wall5 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 20, 6),
      phongMaterial
    );
    wall5.position.set(-4.5, 1, 10);
    // scene.add(wall5);

    const WallShape5 = new CANNON.Box(new CANNON.Vec3(0.1, 10, 3));
    const WallRightBody5 = new CANNON.Body({ mass: 0 });
    WallRightBody5.addShape(WallShape5, new CANNON.Vec3());
    WallRightBody5.position.x = wall5.position.x;
    WallRightBody5.position.y = wall5.position.y;
    WallRightBody5.position.z = wall5.position.z;
    world.addBody(WallRightBody5);
    // wall 6
    const wall6 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(6, 20, 0.1),
      phongMaterial
    );
    wall6.position.set(-7.3, 1, 7.4);
    // scene.add(wall6);

    const WallShape6 = new CANNON.Box(new CANNON.Vec3(3, 10, 0.1));
    const WallRightBody6 = new CANNON.Body({ mass: 0 });
    WallRightBody6.addShape(WallShape6, new CANNON.Vec3());
    WallRightBody6.position.x = wall6.position.x;
    WallRightBody6.position.y = wall6.position.y;
    WallRightBody6.position.z = wall6.position.z;
    world.addBody(WallRightBody6);
    // wall second floor
    const wallsecondFloor = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 2, 15),
      phongMaterial
    );
    wallsecondFloor.position.set(2.3, 5, 5.0);
    // scene.add(wallsecondFloor);

    const wallsecondFloorShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 7.5));
    const wallsecondFloorBody = new CANNON.Body({ mass: 0 });
    wallsecondFloorBody.addShape(wallsecondFloorShape, new CANNON.Vec3());
    wallsecondFloorBody.position.x = wallsecondFloor.position.x;
    wallsecondFloorBody.position.y = wallsecondFloor.position.y;
    wallsecondFloorBody.position.z = wallsecondFloor.position.z;
    world.addBody(wallsecondFloorBody);
    // wall second floor q
    const wallsecondFloorQ = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 4, 15),
      phongMaterial
    );
    wallsecondFloorQ.position.set(1.6, 7, 5.0);
    // scene.add(wallsecondFloorQ);

    const wallsecondFloorShapeQ = new CANNON.Box(new CANNON.Vec3(0.1, 2, 7.5));
    const wallsecondFloorBodyQ = new CANNON.Body({ mass: 0 });
    wallsecondFloorBodyQ.addShape(wallsecondFloorShapeQ, new CANNON.Vec3());
    wallsecondFloorBodyQ.position.x = wallsecondFloorQ.position.x;
    wallsecondFloorBodyQ.position.y = wallsecondFloorQ.position.y;
    wallsecondFloorBodyQ.position.z = wallsecondFloorQ.position.z;
    wallsecondFloorBodyQ.quaternion.setFromEuler(0, 0, Math.PI / 5);

    world.addBody(wallsecondFloorBodyQ);
    // wall 7 quaternion left
    const wall7 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(4, 20, 0.1),
      phongMaterial
    );
    wall7.position.set(-11, 1, 6.4);
    // scene.add(wall7);

    const WallShape7 = new CANNON.Box(new CANNON.Vec3(2, 10, 0.1));
    const WallRightBody7 = new CANNON.Body({ mass: 0 });
    WallRightBody7.addShape(WallShape7, new CANNON.Vec3());
    WallRightBody7.position.x = wall7.position.x;
    WallRightBody7.position.y = wall7.position.y;
    WallRightBody7.position.z = wall7.position.z;
    WallRightBody7.quaternion.setFromEuler(0, Math.PI / -4, 0);

    world.addBody(WallRightBody7);

    //
    // wall 8 quaternion left
    const wall8 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(4, 20, 0.1),
      phongMaterial
    );
    wall8.position.set(-11, 1, -1);
    // scene.add(wall8);

    const WallShape8 = new CANNON.Box(new CANNON.Vec3(2, 10, 0.1));
    const WallRightBody8 = new CANNON.Body({ mass: 0 });
    WallRightBody8.addShape(WallShape8, new CANNON.Vec3());
    WallRightBody8.position.x = wall8.position.x;
    WallRightBody8.position.y = wall8.position.y;
    WallRightBody8.position.z = wall8.position.z;
    WallRightBody8.quaternion.setFromEuler(0, Math.PI / +4, 0);

    world.addBody(WallRightBody8);
    //
    // wall 9 middle no quaternion
    const wall9 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 20, 5),
      phongMaterial
    );
    wall9.position.set(-12.5, 1, 2.5);
    // scene.add(wall9);

    const WallShape9 = new CANNON.Box(new CANNON.Vec3(0.1, 10, 2.5));
    const WallRightBody9 = new CANNON.Body({ mass: 0 });
    WallRightBody9.addShape(WallShape9, new CANNON.Vec3());
    WallRightBody9.position.x = wall9.position.x;
    WallRightBody9.position.y = wall9.position.y;
    WallRightBody9.position.z = wall9.position.z;

    world.addBody(WallRightBody9);

    const tableCollision = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1.5, 1, 3),
      phongMaterial
    );
    tableCollision.position.set(-0.2, 0.3, 2.1);
    // scene.add(tableCollision);

    const tableCannonShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.5, 1.5));
    const tableCannonBody = new CANNON.Body({ mass: 0 });
    tableCannonBody.addShape(tableCannonShape, new CANNON.Vec3());
    tableCannonBody.position.x = tableCollision.position.x;
    tableCannonBody.position.y = tableCollision.position.y;
    tableCannonBody.position.z = tableCollision.position.z;
    world.addBody(tableCannonBody);
    //
    //
    // Animation wall
    // const wallFa = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(0.1, 10, 10),
    //   phongMaterial
    // );
    // // scene.add(wallFa);

    // wallFa.position.set(-6, 3, 2.5);
    // const WallShapeA = new CANNON.Box(new CANNON.Vec3(0.1, 5, 5));
    // const WallRightBodyA = new CANNON.Body({ mass: 0 });
    // WallRightBodyA.addShape(WallShapeA, new CANNON.Vec3());
    // WallRightBodyA.position.x = wallFa.position.x;
    // WallRightBodyA.position.y = wallFa.position.y;
    // WallRightBodyA.position.z = wallFa.position.z;
    // world.addBody(WallRightBodyA);
    // WallRightBodyA.collisionsResponse = 0;
    // const halfExtents = new CANNON.Vec3(0.25, 0.25, 0.25);
    // const boxShape = new CANNON.Box(halfExtents);
    // const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    // WallRightBodyA.addEventListener("collide", function (e) {
    //   // console.log("animate");
    //   collideWall = true;
    //   WallRightBodyA.position.z = -100;
    //   // Add boxes both in cannon.js and three.js
    //   const textureGift = new THREE.TextureLoader().load(
    //     "./assets/giftTexture.png"
    //   );
    //   textureback.minFilter = THREE.NearestFilter;
    //   const giftMaterial = new THREE.MeshLambertMaterial({
    //     map: textureGift,
    //     transparent: true,
    //     // color: new THREE.Color(0xff0000),
    //     side: THREE.FrontSide,
    //   });
    //   for (let i = 0; i < 5; i++) {
    //     const boxBody = new CANNON.Body({ mass: 5 });
    //     boxBody.addShape(boxShape);
    //     const boxMesh = new THREE.Mesh(sock.geometry, sock.material);
    //     const boxMesh2 = new THREE.Mesh(cane.geometry, cane.material);
    //     const boxMesh3 = new THREE.Mesh(treeSmall.geometry, treeSmall.material);
    //     boxMesh.scale.set(0.8, 0.8, 0.8);
    //     boxMesh2.scale.set(0.8, 0.8, 0.8);
    //     boxMesh3.scale.set(0.5, 0.5, 0.5);
    //     const x = (Math.random() - 3.0) * 5;
    //     const y = (Math.random() - 0.5) * 1;
    //     // const z = (Math.random() - 0.5) * 20;

    //     boxBody.position.set(x, 7, y);
    //     world.addBody(boxBody);
    //     scene.add(boxMesh);
    //     scene.add(boxMesh2);
    //     scene.add(boxMesh3);
    //     boxes.push(boxBody);
    //     boxMeshes.push(boxMesh);
    //     boxMeshes.push(boxMesh2);
    //     boxMeshes.push(boxMesh3);
    //   }
    // });
    // animation wall end
    //
    // wall fireplace end
    //
    // tree
    const TreeShape = new THREE.Mesh(
      new THREE.ConeGeometry(2, 6, 32),
      phongMaterial
    );
    TreeShape.position.set(-10, 4, 4);
    // scene.add(TreeShape);

    const CannonTree = new CANNON.Cylinder(0.01, 3, 6, 4, 1);
    const CannonBodyTree = new CANNON.Body({ mass: 0 });
    CannonBodyTree.addShape(CannonTree, new CANNON.Vec3());
    CannonBodyTree.position.x = TreeShape.position.x;
    CannonBodyTree.position.y = TreeShape.position.y;
    CannonBodyTree.position.z = TreeShape.position.z;
    world.addBody(CannonBodyTree);
    //
    //
    //
    //
    // use this to test non-split solver
    // world.solver = solver
    const solver = new CANNON.GSSolver();
    solver.iterations = 20;
    solver.tolerance = 20;
    world.solver = new CANNON.SplitSolver(solver);
    world.gravity.set(0, -10, 0);

    // Create a slippery material (friction coefficient = 0.0)
    physicsMaterial = new CANNON.Material("physics");
    const physics_physics = new CANNON.ContactMaterial(
      physicsMaterial,
      physicsMaterial,
      {
        friction: 0.1,
        restitution: 0.2,
      }
    );
    physics_physics.contactEquationStiffness = 1e8;
    physics_physics.contactEquationRegularizationTime = 3;

    // We must add the contact materials to the world
    world.addContactMaterial(physics_physics);

    // Create the user collision sphere
    const radius = 1.3;
    sphereShape = new CANNON.Sphere(radius);
    sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0, radius, 20);
    camera.position.set(0, 0, 20);
    sphereBody.linearDamping = 0.99;
    world.addBody(sphereBody);

    // Create the ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      material: physicsMaterial,
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, 0.1, 0);
    world.addBody(groundBody);
    // Add left door hinge
    const size = 0.85;
    const mass = 50;
    const space = 0.02;
    let positionX = 2.5;
    const N = 2;
    const halfExtents2 = new CANNON.Vec3(1.31, 0.73, 1 * 0.02);
    const boxShape2 = new CANNON.Box(halfExtents2);
    const boxGeometry2 = new THREE.BoxBufferGeometry(
      halfExtents2.x * 2,
      halfExtents2.y * 2,
      halfExtents2.z * 2
    );
    const texturefront = new THREE.TextureLoader().load(
      "./assets/logo-weband.png"
    );
    texturefront.center.x = 0.5;
    texturefront.center.y = 0.5;
    texturefront.rotation = Math.PI * -0.5;
    texturefront.repeat.set(2, 4);
    // texturefront.minFilter = THREE.NearestFilter;
    const textureback = new THREE.TextureLoader().load(
      "./assets/logo-weband.png"
    );
    textureback.center.x = 0.5;
    textureback.center.y = 0.5;
    textureback.rotation = Math.PI * -0.5;
    textureback.repeat.set(2, 4);
    textureback.flipY = false;
    // textureback.minFilter = THREE.NearestFilter;
    var cubeMaterialArray = [];

    // const newMaterial = new THREE.MeshStandardMaterial({
    //   map: texturefront,
    //   transparent: true,
    //   color: new THREE.Color(0xcfa0a0),
    //   side: THREE.FrontSide,
    // });
    let panelColor = 0x00000;
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        map: texturefront,
        transparent: true,
        color: new THREE.Color(0x720bab),
        side: THREE.FrontSide,
      })
    );
    cubeMaterialArray.push(
      new THREE.MeshLambertMaterial({
        map: textureback,
        transparent: true,
        color: new THREE.Color(0x720bab),
        side: THREE.FrontSide,
      })
    );
    // newMaterial.onBeforeCompile = function (shader) {
    //   var custom_map_fragment = THREE.ShaderChunk.map_fragment.replace(
    //     `diffuseColor *= texelColor;`,
    //     `diffuseColor = vec4( mix( diffuse, texelColor.rgb, texelColor.a ), opacity  );`
    //   );

    //   shader.fragmentShader = shader.fragmentShader.replace(
    //     "#include <map_fragment>",
    //     custom_map_fragment
    //   );
    // };

    let last;
    for (let i = 0; i < N; i++) {
      // Make the fist one static to support the others
      const boxBody = new CANNON.Body({ mass: i === 0 ? 0 : mass });
      boxBody.addShape(boxShape2);
      const boxMesh = new THREE.Mesh(boxGeometry2, cubeMaterialArray);
      boxBody.position.set(-positionX, 1.43, 11.3);
      var axis = new CANNON.Vec3(0, 0, 1);
      var angle = Math.PI / 2;
      boxBody.quaternion.setFromAxisAngle(axis, angle);
      boxBody.linearDamping = 0.01;
      boxBody.angularDamping = 0.01;

      world.addBody(boxBody);
      scene.add(boxMesh);
      boxes.push(boxBody);
      boxMeshes.push(boxMesh);

      if (i > 0) {
        // Connect the body to the last one
        const constraint1 = new CANNON.PointToPointConstraint(
          boxBody,
          new CANNON.Vec3(-size, size + space, 0),
          last,
          new CANNON.Vec3(-size, -size - space, 0)
        );
        const constranit2 = new CANNON.PointToPointConstraint(
          boxBody,
          new CANNON.Vec3(size, size + space, 0),
          last,
          new CANNON.Vec3(size, -size - space, 0)
        );
        world.addConstraint(constraint1);
        world.addConstraint(constranit2);
      }

      last = boxBody;
    }
    // Add right door hinge
    const texturefront2 = new THREE.TextureLoader().load(
      "./assets/logo-weband.png"
    );
    texturefront2.center.x = 0.5;
    texturefront2.center.y = 0.5;
    texturefront2.rotation = Math.PI * -0.5;
    texturefront2.repeat.set(2, 4);
    texturefront2.flipY = false;

    // texturefront2.minFilter = THREE.NearestFilter;
    const textureback2 = new THREE.TextureLoader().load(
      "./assets/logo-weband.png"
    );
    textureback2.center.x = 0.5;
    textureback2.center.y = 0.5;
    textureback2.rotation = Math.PI * -0.5;
    textureback2.repeat.set(2, 4);
    textureback2.flipY = true;
    // textureback2.minFilter = THREE.NearestFilter;
    var cubeMaterialArray2 = [];

    // const newMaterial = new THREE.MeshStandardMaterial({
    //   map: texturefront,
    //   transparent: true,
    //   color: new THREE.Color(0xcfa0a0),
    //   side: THREE.FrontSide,
    // });
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        color: panelColor,
        side: THREE.DoubleSide,
      })
    );
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        map: texturefront2,
        transparent: true,
        color: new THREE.Color(0x720bab),
        side: THREE.FrontSide,
      })
    );
    cubeMaterialArray2.push(
      new THREE.MeshLambertMaterial({
        map: textureback2,
        transparent: true,
        color: new THREE.Color(0x720bab),
        side: THREE.FrontSide,
      })
    );
    const halfExtents3 = new CANNON.Vec3(1.31, 0.73, 1 * 0.02);
    const boxShape3 = new CANNON.Box(halfExtents3);
    const boxGeometry3 = new THREE.BoxBufferGeometry(
      halfExtents3.x * 2,
      halfExtents3.y * 2,
      halfExtents3.z * 2
    );

    let last2;
    for (let i = 0; i < N; i++) {
      // Make the fist one static to support the others
      const boxBody2 = new CANNON.Body({ mass: i === 0 ? 0 : mass });
      boxBody2.addShape(boxShape3);
      const boxMesh2 = new THREE.Mesh(boxGeometry3, cubeMaterialArray2);
      boxBody2.position.set(positionX, 1.43, 11.3);
      var axis2 = new CANNON.Vec3(0, 0, -1);
      var angle2 = Math.PI / 2;
      boxBody2.quaternion.setFromAxisAngle(axis2, angle2);
      boxBody2.linearDamping = 0.1;
      boxBody2.angularDamping = 0.7;

      world.addBody(boxBody2);
      scene.add(boxMesh2);
      boxes.push(boxBody2);
      boxMeshes.push(boxMesh2);

      if (i > 0) {
        // Connect the body to the last one
        const constraint1 = new CANNON.PointToPointConstraint(
          boxBody2,
          new CANNON.Vec3(-size, size + space, 0),
          last2,
          new CANNON.Vec3(-size, -size - space, 0)
        );
        const constranit2 = new CANNON.PointToPointConstraint(
          boxBody2,
          new CANNON.Vec3(size, size + space, 0),
          last2,
          new CANNON.Vec3(size, -size - space, 0)
        );
        world.addConstraint(constraint1);
        world.addConstraint(constranit2);
      }

      last2 = boxBody2;
    }

    // The shooting balls
    const shootVelocity = 15;
    const ballShape = new CANNON.Sphere(0.2);
    const ballGeometry = new THREE.SphereBufferGeometry(
      ballShape.radius,
      32,
      32
    );

    // Returns a vector pointing the the diretion the camera is at
    function getShootDirection() {
      const vector = new THREE.Vector3(0, 0, 1);
      vector.unproject(camera);
      const ray = new THREE.Ray(
        sphereBody.position,
        vector.sub(sphereBody.position).normalize()
      );
      return ray.direction;
    }

    window.addEventListener("click", (event) => {
      if (!controls.enabled || onGift) {
        return;
      }
      // console.log("throw");
      const halfExtentsBox = new CANNON.Vec3(0.05, 0.25, 0.25);
      const boxShapeThrow = new CANNON.Box(halfExtentsBox);
      const ballBody = new CANNON.Body({ mass: 2 });
      ballBody.addShape(boxShapeThrow);
      // const ballMesh = new THREE.Mesh(ballGeometry, material);
      const ballMesh = new THREE.Mesh(
        christmasLogo.geometry,
        christmasLogo.material
      );
      ballMesh.scale.set(0.2, 0.2, 0.2);

      world.addBody(ballBody);
      scene.add(ballMesh);
      balls.push(ballBody);
      ballMeshes.push(ballMesh);

      const shootDirection = getShootDirection();
      ballBody.velocity.set(
        shootDirection.x * shootVelocity,
        shootDirection.y * shootVelocity,
        shootDirection.z * shootVelocity
      );

      // Move the ball outside the player sphere
      const x =
        sphereBody.position.x +
        shootDirection.x * (sphereShape.radius * 1.02 + ballShape.radius);
      const y =
        sphereBody.position.y +
        shootDirection.y * (sphereShape.radius * 1.02 + ballShape.radius);
      const z =
        sphereBody.position.z +
        shootDirection.z * (sphereShape.radius * 1.02 + ballShape.radius);
      ballBody.position.set(x, y, z);
      ballMesh.position.copy(ballBody.position);
    });
  }
}
