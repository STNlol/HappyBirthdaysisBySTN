import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import tableMatImage from "./table.png";

// SECTION constants
const candleRadius = 0.35;
const candleHeight = 3.5;
const candleCount = 5;

const baseRadius = 2.5;
const baseHeight = 2;
const middleRadius = 2;
const middleHeight = 1.25;
const topRadius = 1.5;
const topHeight = 1;

const tableHeightOffset = 1;
const photoCount = 20; // Number of photos
const orbitRadius = 6; // Distance from cake
const orbitSpeed = 0.2; // Rotation speed

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(3, 5, 8).setLength(15);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x101005);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

var controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minPolarAngle = THREE.MathUtils.degToRad(60);
controls.maxPolarAngle = THREE.MathUtils.degToRad(95);
controls.minDistance = 4;
controls.maxDistance = 20;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
controls.target.set(0, 2, 0);
controls.update();

var light = new THREE.DirectionalLight(0xffffff, 0.025);
light.position.setScalar(10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.05));

// Flame material
function getFlameMaterial(isFrontSide) {
    let side = isFrontSide ? THREE.FrontSide : THREE.BackSide;
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            uniform float time;
            varying vec2 vUv;
            varying float hValue;
            float random (in vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            float noise (in vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f*f*(3.0-2.0*f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            void main() {
                vUv = uv;
                vec3 pos = position;
                pos *= vec3(0.8, 2, 0.725);
                hValue = position.y;
                float posXZlen = length(position.xz);
                pos.y *= 1. + (cos((posXZlen + 0.25) * 3.1415926) * 0.25 + noise(vec2(0, time)) * 0.125 + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y;
                pos.x += noise(vec2(time * 2., (position.y - time) * 4.0)) * hValue * 0.0312;
                pos.z += noise(vec2((position.y - time) * 4.0, time * 2.)) * hValue * 0.0312;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
            }
        `,
        fragmentShader: `
            varying float hValue;
            varying vec2 vUv;
            vec3 heatmapGradient(float t) {
                return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
            }
            void main() {
                float v = abs(smoothstep(0.0, 0.4, hValue) - 1.);
                float alpha = (1. - v) * 0.99;
                alpha -= 1. - smoothstep(1.0, 0.97, hValue);
                gl_FragColor = vec4(heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95,0.95,0.4), alpha);
                gl_FragColor.rgb = mix(vec3(0,0,1), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue));
                gl_FragColor.rgb += vec3(1, 0.9, 0.5) * (1.25 - vUv.y);
                gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1., hValue));
            }
        `,
        transparent: true,
        side: side
    });
}

var flameMaterials = [];
function flame() {
    let flameGeo = new THREE.SphereGeometry(0.5, 32, 32);
    flameGeo.translate(0, 0.5, 0);
    let flameMat = getFlameMaterial(true);
    flameMaterials.push(flameMat);
    let flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0.06, candleHeight, 0.06);
    flame.rotation.y = THREE.MathUtils.degToRad(-45);
    return flame;
}

function createCandle() {
    var casePath = new THREE.Path();
    casePath.moveTo(0, 0);
    casePath.lineTo(0, 0);
    casePath.absarc(0, 0, candleRadius, Math.PI * 1.5, Math.PI * 2);
    casePath.lineTo(candleRadius, candleHeight);
    var caseGeo = new THREE.LatheGeometry(casePath.getPoints(), 64);
    var caseMat = new THREE.MeshStandardMaterial({ color: 0xff4500 });
    var caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.castShadow = true;

    const topGeometry = new THREE.CylinderGeometry(0.2, candleRadius, 0.1, 32);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = candleHeight;
    caseMesh.add(topMesh);

    var candlewickProfile = new THREE.Shape();
    candlewickProfile.absarc(0, 0, 0.0625, 0, Math.PI * 2);
    var candlewickCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, candleHeight - 1, 0),
        new THREE.Vector3(0, candleHeight - 0.5, -0.0625),
        new THREE.Vector3(0.25, candleHeight - 0.5, 0.125)
    ]);
    var candlewickGeo = new THREE.ExtrudeGeometry(candlewickProfile, {
        steps: 8,
        bevelEnabled: false,
        extrudePath: candlewickCurve
    });
    var colors = [];
    var color1 = new THREE.Color("black");
    var color2 = new THREE.Color(0x994411);
    var color3 = new THREE.Color(0xffff44);
    for (let i = 0; i < candlewickGeo.attributes.position.count; i++) {
        if (candlewickGeo.attributes.position.getY(i) < 0.4) {
            color1.toArray(colors, i * 3);
        } else {
            color2.toArray(colors, i * 3);
        }
        if (candlewickGeo.attributes.position.getY(i) < 0.15) color3.toArray(colors, i * 3);
    }
    candlewickGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    candlewickGeo.translate(0, 0.95, 0);
    var candlewickMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    var candlewickMesh = new THREE.Mesh(candlewickGeo, candlewickMat);
    caseMesh.add(candlewickMesh);

    return caseMesh;
}

const candleMesh = createCandle();
var candleLight = new THREE.PointLight(0xffaa33, 1, 5, 2);
candleLight.position.set(0, candleHeight, 0);
candleLight.castShadow = true;
candleMesh.add(candleLight);
var candleLight2 = new THREE.PointLight(0xffaa33, 1, 10, 2);
candleLight2.position.set(0, candleHeight + 1, 0);
candleLight2.castShadow = true;
candleMesh.add(candleLight2);
candleMesh.add(flame());
candleMesh.add(flame());

// Table
var tableGeo = new THREE.CylinderGeometry(14, 14, 0.5, 64);
tableGeo.translate(0, -tableHeightOffset, 0);
const textureLoader = new THREE.TextureLoader();
const tableTexture = textureLoader.load(tableMatImage);
var tableMat = new THREE.MeshStandardMaterial({ map: tableTexture, metalness: 0, roughness: 0.75 });
var tableMesh = new THREE.Mesh(tableGeo, tableMat);
tableMesh.receiveShadow = true;
scene.add(tableMesh);

// Cake
function createCake() {
    const cakeGroup = new THREE.Group();
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xfff5ee });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    const middleGeometry = new THREE.CylinderGeometry(middleRadius, middleRadius, middleHeight, 32);
    const middleMaterial = new THREE.MeshPhongMaterial({ color: 0xfffafa });
    const middleMesh = new THREE.Mesh(middleGeometry, middleMaterial);
    middleMesh.position.y = baseHeight / 2 + middleHeight / 2;
    const topGeometry = new THREE.CylinderGeometry(topRadius, topRadius, topHeight, 32);
    const topMaterial = new THREE.MeshPhongMaterial({ color: 0xf0ffff });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = baseHeight / 2 + middleHeight + topHeight / 2;
    cakeGroup.add(baseMesh);
    cakeGroup.add(middleMesh);
    cakeGroup.add(topMesh);
    return cakeGroup;
}

const cake = createCake();
scene.add(cake);

candleMesh.scale.set(0.3, 0.3, 0.3);
candleMesh.castShadow = false;
candleMesh.position.y = baseHeight / 2 + middleHeight + topHeight;

// Candles
function createCandles(count) {
    const candleGroup = new THREE.Group();
    const radius = 1;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const candle = candleMesh.clone();
        candle.position.x = Math.cos(angle) * radius;
        candle.position.z = Math.sin(angle) * radius;
        candleGroup.add(candle);
    }
    return candleGroup;
}

const candles = createCandles(candleCount);
cake.add(candles);

// Photos
function createPhotoMesh(imageUrl) {
    const texture = textureLoader.load(imageUrl);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(1.5, 1.5); // Larger photos
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function createPhotoGroup() {
    const group = new THREE.Group();
    for (let i = 1; i <= photoCount; i++) {
        const photo = createPhotoMesh(`/photos/photo${i % 10 || 10}.jpg`); // photo1.jpg to photo10.jpg
        group.add(photo);
    }
    group.children.forEach((photo, index) => {
        const angle = (index / photoCount) * Math.PI * 2;
        photo.position.x = Math.cos(angle) * orbitRadius;
        photo.position.z = Math.sin(angle) * orbitRadius;
        photo.position.y = 3 + Math.random() * 2; // Random height
        photo.lookAt(cake.position);
    });
    return group;
}

const photoGroup = createPhotoGroup();
scene.add(photoGroup);

// Animation
var clock = new THREE.Clock();
var time = 0;

function render() {
    requestAnimationFrame(render);
    time += clock.getDelta();
    photoGroup.rotation.y += 0.002 * orbitSpeed;
    flameMaterials[0].uniforms.time.value = time;
    flameMaterials[1].uniforms.time.value = time;
    candleLight2.position.x = Math.sin(time * Math.PI) * 0.25;
    candleLight2.position.z = Math.cos(time * Math.PI * 0.75) * 0.25;
    candleLight2.intensity = 2 + Math.sin(time * Math.PI * 2) * Math.cos(time * Math.PI * 1.5) * 0.25;
    controls.update();
    renderer.render(scene, camera);
}

// Event listeners
let holdTimeout;
let allowBlowout = false;
const holdReminder = document.getElementById('hold-reminder');
const audio = document.getElementById("happy-birthday-audio");
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

audio.addEventListener('ended', function() {
    holdReminder.style.display = 'flex';
    setTimeout(function() {
        holdReminder.classList.add('show');
    }, 10);
    allowBlowout = true;
});

function handleHoldStart() {
    if(!allowBlowout) return;
    holdTimeout = setTimeout(() => {
        blowOutCandles();
    }, 500);
}

function handleHoldEnd() {
    clearTimeout(holdTimeout);
}

document.addEventListener('mousedown', handleHoldStart);
document.addEventListener('touchstart', handleHoldStart);
document.addEventListener('mouseup', handleHoldEnd);
document.addEventListener('touchend', handleHoldEnd);

function showCongratulation() {
    const overlay = document.getElementById('congratulation-overlay');
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.opacity = '1';
}

function blowOutCandles() {
    candles.children.forEach(candle => {
        const speed = 1 + Math.random() * 3;
        extinguishCandle(candle, speed);
    });

    let ambientLightIntensity = ambientLight.intensity;
    const ambientInterval = setInterval(() => {
        ambientLightIntensity += 0.01;
        if (ambientLightIntensity >= 0.1) {
            clearInterval(ambientInterval);
            ambientLight.intensity = 0.1;
            showCongratulation();
        } else {
            ambientLight.intensity = ambientLightIntensity;
        }
    }, 50);

    document.getElementById('hold-reminder').style.display = 'none';
}

function extinguishCandle(candle, speed) {
    const flames = candle.children.filter(child => child.material && child.material.type === 'ShaderMaterial');
    const lights = candle.children.filter(child => child instanceof THREE.PointLight);
    let progress = 0;
    const extinguishInterval = setInterval(() => {
        progress += 0.02 * speed;
        if (progress >= 1) {
            clearInterval(extinguishInterval);
            flames.forEach(flame => flame.visible = false);
            lights.forEach(light => light.intensity = 0);
        } else {
            flames.forEach(flame => {
                flame.material.opacity = 1 - progress;
                flame.scale.set(1 - progress, 1 - progress, 1 - progress);
            });
            lights.forEach(light => {
                light.intensity = 1 - progress;
            });
        }
    }, 30);
}

render();
