import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import GUI from 'lil-gui';
import coffeeSmokeVertexShader from './shaders/coffeeSmoke/vertex.glsl'
import coffeeSmokeFragmentShader from './shaders/coffeeSmoke/fragment.glsl'
import auroraBorealisVertexShader from './shaders/auroraBorealis/vertex.glsl'
import auroraBorealisFragmentShader from './shaders/auroraBorealis/fragment.glsl'
import { gsap } from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

//scene
const scene = new THREE.Scene()
const canvas = document.querySelector('canvas.webgl')


const audio = document.getElementById('bgAudio');
const toggleBtn = document.getElementById('audioToggle');
const playSlash = document.getElementById('playSlash');
const soundWave = document.getElementById('soundWave');


audio.pause();
playSlash.style.display = 'none';
soundWave.style.display = 'block';

toggleBtn.addEventListener('click', async () => {
    try {
        if (audio.paused) {
            await audio.play();
            // Music is now playing - show slash
            playSlash.style.display = 'block';
            soundWave.style.display = 'none';
        } else {
            audio.pause();
            // Music paused - hide slash
            playSlash.style.display = 'none';
            soundWave.style.display = 'block';
        }
    } catch (err) {
        console.error('Audio error:', err);
    }
});
let model = null
let floor0group = new THREE.Group()
let floor1group = new THREE.Group()
let floor2group = new THREE.Group()
let floor3group = new THREE.Group()
let floor4group = new THREE.Group()

//lights

// //Hemisphere Light
const hemisphereLight = new THREE.HemisphereLight(0xACCFFF, 0xDDE7F2, 0.1)
hemisphereLight.position.set(0, 20, 0)
scene.add(hemisphereLight)

const directionalLight = new THREE.DirectionalLight(0xB3D9FF, 0.3)
directionalLight.position.set(2, 1, 12)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.radius = 1
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 12

directionalLight.shadow.camera.left = -3
directionalLight.shadow.camera.right = 3
directionalLight.shadow.camera.top = 3
directionalLight.shadow.camera.bottom = -3
directionalLight.shadow.bias = -0.0005
directionalLight.shadow.normalBias = 0.1

scene.add(directionalLight)
directionalLight.target.position.set(0, 0, 0)
scene.add(directionalLight.target)

//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1, 3.5)
camera.lookAt(0, 0, 0)
scene.add(camera)

//orbit controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
//controls.enableRotate = false

controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2
controls.maxDistance = 3.5
controls.minDistance = 1.5
//renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }) //antialias smooths the pixels
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding //corrects the color encoding
renderer.toneMapping = THREE.ACESFilmicToneMapping; //Blender style
renderer.toneMappingExposure = 1.0
renderer.render(scene, camera)
scene.environmentIntensity = 1.0 //may not need
//resize event
window.addEventListener('resize', () => {
    //update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    //update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//Overlay
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,

    uniforms: {
        uAlpha: { value: 1 }
    },
    vertexShader: `
    void main()
    {
    gl_Position = vec4(position, 1.0);
    }`,
    fragmentShader: `
    uniform float uAlpha;
    void main(){
    gl_FragColor = vec4(0.0, 0.0,0.0, uAlpha);
    }
    `
})
overlayMaterial.depthWrite = false
overlayMaterial.depthTest = false //sent the depth write to be false for it to disappear

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
overlay.renderOrder = 10
scene.add(overlay)


const loadingBarElement = document.querySelector('.loading-bar')
//loading Manager
const loadingManager = new THREE.LoadingManager(
    //loaded
    () => {
        window.setTimeout(() => {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
            document.getElementById("mainContent").style.display = "block";
        }, 500)
    },

    (itemUrl, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
    }
)

//textureloader
const textureLoader = new THREE.TextureLoader(loadingManager) //added loading manager to the textures
//dracoLoader
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('/draco/')
//gltfloader
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

//perlinTexture
//have to make sure the UVs are good in blender
const perlinTexture = textureLoader.load('./perlin.png', (texture) => {

    perlinTexture.wrapS = THREE.RepeatWrapping
    perlinTexture.wrapT = THREE.RepeatWrapping
    perlinTexture.transparent = true
    perlinTexture.depthWrite = false

})


//aurora borealis
//geometry
//first plane was 20, 4
const auroraBorealisGeometry = new THREE.PlaneGeometry(20, 8, 32, 32)
auroraBorealisGeometry.translate(0, 1, -2.25)
//mesh
const auroraBorealisMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: auroraBorealisVertexShader,
    fragmentShader: auroraBorealisFragmentShader,

    uniforms: {
        uFrequency: { value: new THREE.Vector2(100, 50) },
        uTime: { value: 0 },
        uPerlinTexture: { value: perlinTexture }
    }
})

const auroraBorealisMesh = new THREE.Mesh(auroraBorealisGeometry, auroraBorealisMaterial)
auroraBorealisMesh.rotation.z = -Math.PI / 1.9; //fixed it to be 1.9
auroraBorealisMesh.castShadow = false
auroraBorealisMesh.receiveShadow = false
scene.add(auroraBorealisMesh)
//snow
//geometry
const snowTexture = textureLoader.load('./snow.png')
const particlesGeometry = new THREE.BufferGeometry()
const count = 2000
const positions = new Float32Array(count * 3)

for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 7
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

//velocities for snow particles for tick function
const velocities = new Float32Array(count)
for (let i = 0; i < count; i++) {
    velocities[i] = 0.001 + Math.random() * 0.002 //speed and I decreased both values to slow it completely down
}

particlesGeometry.setAttribute('velocities', new THREE.BufferAttribute(velocities, 1))
//material
const particlesMaterial = new THREE.PointsMaterial()
particlesMaterial.size = 0.02
particlesMaterial.sizeAttenuation = true
particlesMaterial.alphaMap = snowTexture
particlesMaterial.transparent = true
particlesMaterial.depthWrite = false
particlesMaterial.alphaTest = 0.01

//mesh for points snow
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
particles.renderOrder = 1 //sets the order of when to render
particles.castShadow = false
particles.receiveShadow = false
scene.add(particles)
//smokeShaderMaterial
const smokeMaterial = new THREE.ShaderMaterial({

    vertexShader: coffeeSmokeVertexShader,
    fragmentShader: coffeeSmokeFragmentShader,
    uniforms:
    {
        uTime: new THREE.Uniform(0),
        uPerlinTexture: new THREE.Uniform(perlinTexture),
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,

})

gltfLoader.load('./AdventCalendar.glb',
    (gltf) => {
        model = gltf.scene
        gltf.scene.scale.set(2, 2, 2)
        model.position.set(0, -1, 0)
        scene.add(model)

        model.traverse((child) => {
            if (!child.isMesh) return
            if (child.name.includes("SmokePlane")) {
                child.material = smokeMaterial
                child.castShadow = false
                child.receiveShadow = false
                return
            }

            if (child.name.includes("Chimney")) {
                child.castShadow = false
                child.receiveShadow = false
                return
            }
            if (child.name.includes("Floor")) {
                child.castShadow = false
                child.receiveShadow = true
                return
            }
            child.castShadow = true
            child.receiveShadow = true
            if (child.material.emissive) {
                child.material.emissiveIntensity = 2
            }
        })

        //Access a group from blender
        floor0group = model.getObjectByName("Floor_Zero_E")
        floor1group = model.getObjectByName("Floor_One_E")
        floor2group = model.getObjectByName("Floor_Two_E")
        floor3group = model.getObjectByName("Floor_Three_E")
        floor4group = model.getObjectByName("Floor_Four_E")
    })

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6,   //strength
    0.4,   //radius
    0.3    //threshold
);
composer.addPass(bloomPass);

//clock
const clock = new THREE.Clock()

//tick function
const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    //rotate objects
    if (floor0group && floor2group && floor4group) {
        floor0group.rotation.y += 0.001
        floor2group.rotation.y += 0.001
        floor4group.rotation.y += 0.001
    }
    if (floor1group && floor3group) {
        floor1group.rotation.y -= 0.001
        floor3group.rotation.y -= 0.001
    }

    //update snow
    const positionAttr = particlesGeometry.getAttribute('position')
    const velocityAttr = particlesGeometry.getAttribute('velocities')

    const posArray = positionAttr.array
    const velArray = velocityAttr.array

    for (let i = 0; i < count; i++) {
        const i3 = i * 3

        // Move downward
        posArray[i3 + 1] -= velArray[i]

        //reset when it hits a certain position
        if (posArray[i3 + 1] < -3.5) { //if the particle is below 1.5
            posArray[i3 + 0] = (Math.random() - 0.5) * 7 //give a random x position
            posArray[i3 + 1] = (Math.random() - 0.5) * 7 //give a random y position
            posArray[i3 + 2] = (Math.random() - 0.5) * 7 //give a random z position
        }
    }

    positionAttr.needsUpdate = true

    //Update Aurora Borealis
    auroraBorealisMaterial.uniforms.uTime.value = elapsedTime
    //Update smoke
    smokeMaterial.uniforms.uTime.value = elapsedTime

    controls.update()
    renderer.render(scene, camera)
    //update bloom
    composer.render()
    requestAnimationFrame(tick)
}

tick()


