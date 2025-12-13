import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import GUI from 'lil-gui';
import coffeeSmokeVertexShader from './shaders/coffeeSmoke/vertex.glsl'
import coffeeSmokeFragmentShader from './shaders/coffeeSmoke/fragment.glsl'
import auroraBorealisVertexShader from './shaders/auroraBorealis/vertex.glsl'
import auroraBorealisFragmentShader from './shaders/auroraBorealis/fragment.glsl'

//scene
const scene = new THREE.Scene()
const canvas = document.querySelector('canvas.webgl')


//lights

//Hemisphere Light
const hemisphereLight = new THREE.HemisphereLight(0xACCFFF, 0xDDE7F2, 0.5)
hemisphereLight.position.set(0, 20, 0)
scene.add(hemisphereLight)

const directionalLight = new THREE.DirectionalLight(0xB3D9FF, 0.3)
directionalLight.position.set(5, 10, 7.5)
scene.add(directionalLight)

//light helpers
const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 0.2)
scene.add(hemisphereLightHelper)

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2)
scene.add(directionalLightHelper)

//dat gui
const gui = new GUI()
gui.add(hemisphereLight, 'intensity').min(0).max(3).step(0.001).name('hemisphereLightIntensity')
gui.add(directionalLight, 'intensity').min(0).max(3).step(0.001).name('directionalLightIntensity')

//camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1, 3.5)
camera.lookAt(0, 0, 0)
scene.add(camera)

//orbit controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.enableRotate = false
controls.maxDistance = 3.5

//renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }) //antialias smooths the pixels
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
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

//fullscreen event
window.addEventListener('dblclick', () => {

    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
    if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen()
        }
        else if (canvas.webkitRequestFullScreen()) {
            canvas.webkitRequestFullScreen()
        }
    }
    else {
        if (document.exitFullscreen) {
            canvas.exitFullScreen()
        }
        else if (document.webkitExitFullScreen()) {
            document.webkitExitFullScreen()
        }

    }
})

//textureloader
const textureLoader = new THREE.TextureLoader()

//dracoLoader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
//gltfloader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

//perlinTexture
//have to make sure the UVs are good in blender
const perlinTexture = textureLoader.load('./perlin.png', (texture) =>{

perlinTexture.wrapS = THREE.RepeatWrapping
perlinTexture.wrapT = THREE.RepeatWrapping
perlinTexture.transparent = true
perlinTexture.depthWrite = false

})


//aurora borealis
//geometry
//first plane was 20, 4
const auroraBorealisGeometry = new THREE.PlaneGeometry(12, 4, 32, 32)
auroraBorealisGeometry.translate(0, 1, -2.25)



//mesh
const auroraBorealisMaterial = new THREE.ShaderMaterial({
    //wireframe: true,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: auroraBorealisVertexShader,
    fragmentShader: auroraBorealisFragmentShader,

    uniforms:{
        uFrequency: {value: new THREE.Vector2(100, 50)},
        uTime: {value: 0},
        uPerlinTexture: {value: perlinTexture}
    }
})

const auroraBorealisMesh = new THREE.Mesh(auroraBorealisGeometry, auroraBorealisMaterial)
auroraBorealisMesh.rotation.z = Math.PI / 1.8; //rotated on the z
scene.add(auroraBorealisMesh)
//snow
//geometry
const snowTexture = textureLoader.load('./snow.png')
const particlesGeometry = new THREE.BufferGeometry()
const count = 1000
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

//mesh for points snow
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
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
    depthWrite:false,
 
})
gltfLoader.load('./AdventCalendar.glb',
    (gltf) => {
        const model = gltf.scene
        gltf.scene.scale.set(2, 2, 2)
        model.position.set(0, -1, 0)
        scene.add(model)

        //traverses the model to see if any plane includes the word Smoke
        model.traverse((child) => {
            if (child.isMesh && child.name.includes("Smoke")) {
                child.material = smokeMaterial
            }
        })



    })


//clock
const clock = new THREE.Clock()

//tick function
const tick = () => {

    const elapsedTime = clock.getElapsedTime()

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

        //TODO: reset position if the snow position is equal to any of the glb objects 
    }

    positionAttr.needsUpdate = true

    //Update Aurora Borealis
    auroraBorealisMaterial.uniforms.uTime.value = elapsedTime
    //Update smoke
    smokeMaterial.uniforms.uTime.value = elapsedTime
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}

tick()


