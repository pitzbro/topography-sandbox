// GLOBALS

var vectorHeight = new THREE.Vector2(topographyIntensity, topographyIntensity);
//topography
var topographyHeight = 1325;
var topographyIntensity = 2.7;

//Textures
var texturesRepeat = 10;

//fog
var fogIntensity = 2500;
var fogColor = '0x000000';

//camera
var cameraHeight = 3000;
var cameraTilt = 0;
var cameraPan = -2500;

//lights
var lightAmbientColor = '0xd6d6d6';
var lightDirectionalColor = '0xffffff';
var lightPointColor = '0x787878';

function resetTypography() {
    //Topography
    uniformsTerrain['uDisplacementScale'].value = topographyHeight;
    vectorHeight.set(topographyIntensity, topographyIntensity);

    //Textures
    uniformsTerrain['uRepeatOverlay'].value.set(texturesRepeat, texturesRepeat);

    //fog
    scene.fog.near = fogIntensity;
    scene.fog.color.setHex(fogColor);

    //Camera
    camera.position.set(cameraPan, cameraHeight, cameraTilt);

    //lights
    ambientLight.color.setHex(lightAmbientColor);
    directionalLight.color.setHex(lightDirectionalColor);
    pointLight.color.setHex(lightPointColor);
}

function updateTypography(cords) {

    const { x, y } = cords

    // const cameraHeightMin = 0;
    // const cameraHeightMax = 3000;

    const cHeight = 3000 * (1 - y);
    const cTilt = 3000 * x;
    const cPan = -3000 * (1 - x);
    camera.position.set(cPan, cHeight, cTilt);
    // const tHeight = 3000 * y;
    // uniformsTerrain['uDisplacementScale'].value = tHeight;



}


function changeTopography() {


    var inputs = document.getElementsByClassName('gui-input');

    //Topography
    topographyHeight = inputs.topographyHeight.value;
    uniformsTerrain['uDisplacementScale'].value = topographyHeight;

    topographyIntensity = inputs.topographyIntensity.value;
    vectorHeight.set(topographyIntensity, topographyIntensity);

    //Textures
    texturesRepeat = inputs.texturesRepeat.value;
    uniformsTerrain['uRepeatOverlay'].value.set(texturesRepeat, texturesRepeat);

    //fog
    fogIntensity = inputs.fogIntensity.value;
    fogColor = '0x' + inputs.fogColor.value.substring(1);

    scene.fog.near = fogIntensity;
    scene.fog.color.setHex(fogColor);

    //Camera
    cameraHeight = inputs.cameraHeightRange.value;
    cameraTilt = inputs.cameraTiltRange.value;
    cameraPan = inputs.cameraPanRange.value;

    camera.position.set(cameraPan, cameraHeight, cameraTilt);

    //lights

    lightAmbientColor = '0x' + inputs.lightAmbientColor.value.substring(1);
    lightDirectionalColor = '0x' + inputs.lightDirectionalColor.value.substring(1);
    lightPointColor = '0x' + inputs.lightPointColor.value.substring(1);


    ambientLight.color.setHex(lightAmbientColor);
    directionalLight.color.setHex(lightDirectionalColor);
    pointLight.color.setHex(lightPointColor);

    //code

    generateCode();

}

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar-gui');
    sidebar.classList.toggle('open');
}

function generateCode() {
    var el = document.getElementsByClassName('topography-code')[0];
    el.innerHTML =

        `// GLOBALS

//topography
topographyHeight: ${topographyHeight},
topographyIntensity: ${topographyIntensity},

//textures
texturesRepeat: ${texturesRepeat},

//fog
fogIntensity: ${fogIntensity},
fogColor: ${fogColor},

//camera
cameraHeight: ${cameraHeight},
cameraTilt: ${cameraTilt},
cameraPan: ${cameraPan},

//lights

lightAmbientColor: ${lightAmbientColor},
lightDirectionalColor: ${lightDirectionalColor},
lightPointColor: ${lightPointColor}`

}

generateCode()

//--------------------------------------------------

if (!Detector.webgl) Detector.addGetWebGLMessage();

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var renderer, container;

var camera, scene, controls;
var cameraOrtho, sceneRenderTarget;

var uniformsNoise, uniformsNormal, uniformsTerrain,
    heightMap, normalMap,
    quadTarget;

var directionalLight, pointLight;

var terrain;

var textureCounter = 0;

var animDelta = 0, animDeltaDir = 1;
var lightVal = 0, lightDir = 1;

var clock = new THREE.Clock();

var updateNoise = true;

var animateTerrain = false;

var mlib = {};

init();
animate();

function restart() {
    init();
    animate();
}

function init() {

    container = document.getElementById('container');

    // SCENE (RENDER TARGET)

    sceneRenderTarget = new THREE.Scene();

    cameraOrtho = new THREE.OrthographicCamera(SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10000, 10000);
    cameraOrtho.position.z = 100;

    sceneRenderTarget.add(cameraOrtho);

    // CAMERA

    camera = new THREE.PerspectiveCamera(40, SCREEN_WIDTH / SCREEN_HEIGHT, 2, 4000);
    camera.position.set(cameraPan, cameraHeight, cameraTilt);

    controls = new THREE.OrbitControls(camera);
    controls.target.set(0, 0, 0);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.keys = [65, 83, 68];

    // SCENE (FINAL)

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, fogIntensity, 4000);

    // LIGHTS

    ambientLight = new THREE.AmbientLight(0x432d2d);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.15);
    directionalLight.position.set(500, 2000, 0);
    scene.add(directionalLight);

    pointLight = new THREE.PointLight(0x8c8c8c, 1.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);


    // HEIGHT + NORMAL MAPS

    var normalShader = THREE.NormalMapShader;

    var rx = 256, ry = 256;
    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

    heightMap = new THREE.WebGLRenderTarget(rx, ry, pars);
    heightMap.texture.generateMipmaps = false;

    normalMap = new THREE.WebGLRenderTarget(rx, ry, pars);
    normalMap.texture.generateMipmaps = false;

    uniformsNoise = {

        time: { value: 1.0 },
        scale: { value: vectorHeight },
        offset: { value: new THREE.Vector2(0, 0) }

    };

    uniformsNormal = THREE.UniformsUtils.clone(normalShader.uniforms);

    uniformsNormal.height.value = 0.05;
    uniformsNormal.resolution.value.set(rx, ry);
    uniformsNormal.heightMap.value = heightMap.texture;

    var vertexShader = document.getElementById('vertexShader').textContent;

    // TEXTURES

    var loadingManager = new THREE.LoadingManager(function () {
        terrain.visible = true;
    });
    var textureLoader = new THREE.TextureLoader(loadingManager);

    var specularMap = new THREE.WebGLRenderTarget(2048, 2048, pars);
    specularMap.texture.generateMipmaps = false;

    var diffuseTexture1 = textureLoader.load("textures/4/1.jpg");
    var diffuseTexture2 = textureLoader.load("textures/4/2.jpg");
    // var diffuseTexture1 = textureLoader.load("textures/terrain/14.jpg");
    // var diffuseTexture2 = textureLoader.load("textures/terrain/14.jpg");
    var detailTexture = textureLoader.load("textures/terrain/3.jpg");

    diffuseTexture1.wrapS = diffuseTexture1.wrapT = THREE.RepeatWrapping;
    diffuseTexture2.wrapS = diffuseTexture2.wrapT = THREE.RepeatWrapping;
    detailTexture.wrapS = detailTexture.wrapT = THREE.RepeatWrapping;
    specularMap.texture.wrapS = specularMap.texture.wrapT = THREE.RepeatWrapping;

    // TERRAIN SHADER

    var terrainShader = THREE.ShaderTerrain["terrain"];

    uniformsTerrain = THREE.UniformsUtils.clone(terrainShader.uniforms);

    uniformsTerrain['tNormal'].value = normalMap.texture;
    uniformsTerrain['uNormalScale'].value = 3.5;

    uniformsTerrain['tDisplacement'].value = heightMap.texture;

    uniformsTerrain['tDiffuse1'].value = diffuseTexture1;
    uniformsTerrain['tDiffuse2'].value = diffuseTexture2;
    uniformsTerrain['tSpecular'].value = specularMap.texture;
    uniformsTerrain['tDetail'].value = detailTexture;

    uniformsTerrain['enableDiffuse1'].value = true;
    uniformsTerrain['enableDiffuse2'].value = true;
    uniformsTerrain['enableSpecular'].value = true;

    uniformsTerrain['diffuse'].value.setHex(0xffffff);
    uniformsTerrain['specular'].value.setHex(0xffffff);

    uniformsTerrain['shininess'].value = 30;

    uniformsTerrain['uDisplacementScale'].value = topographyHeight;

    uniformsTerrain['uRepeatOverlay'].value.set(6, 6);

    var params = [
        ['heightmap', document.getElementById('fragmentShaderNoise').textContent, vertexShader, uniformsNoise, false],
        ['normal', normalShader.fragmentShader, normalShader.vertexShader, uniformsNormal, false],
        ['terrain', terrainShader.fragmentShader, terrainShader.vertexShader, uniformsTerrain, true]
    ];

    for (var i = 0; i < params.length; i++) {

        var material = new THREE.ShaderMaterial({

            uniforms: params[i][3],
            vertexShader: params[i][2],
            fragmentShader: params[i][1],
            lights: params[i][4],
            fog: true
        });

        mlib[params[i][0]] = material;

    }


    var plane = new THREE.PlaneBufferGeometry(SCREEN_WIDTH, SCREEN_HEIGHT);

    quadTarget = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    quadTarget.position.z = -500;
    sceneRenderTarget.add(quadTarget);

    // TERRAIN MESH

    var geometryTerrain = new THREE.PlaneBufferGeometry(6000, 6000, 256, 256);

    THREE.BufferGeometryUtils.computeTangents(geometryTerrain);

    terrain = new THREE.Mesh(geometryTerrain, mlib['terrain']);
    terrain.position.set(0, -125, 0);
    terrain.rotation.x = -Math.PI / 2;
    terrain.visible = false;
    scene.add(terrain);

    // RENDERER

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    // changeTopography()
    resetTypography()

    onWindowResize();

    window.addEventListener('resize', onWindowResize, false);

}

//

function onWindowResize(event) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

}

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    var delta = clock.getDelta();

    if (terrain.visible) {

        controls.update();

        var time = Date.now() * 0.001;

        var fLow = 0.1, fHigh = 0.8;

        lightVal = THREE.Math.clamp(lightVal + 0.5 * delta * lightDir, fLow, fHigh);

        var valNorm = (lightVal - fLow) / (fHigh - fLow);

        scene.fog.color.setHex(fogColor);

        renderer.setClearColor(scene.fog.color);

        directionalLight.intensity = THREE.Math.mapLinear(valNorm, 0, 1, 0.1, 1.15);
        pointLight.intensity = THREE.Math.mapLinear(valNorm, 0, 1, 0.9, 1.5);

        uniformsTerrain['uNormalScale'].value = THREE.Math.mapLinear(valNorm, 0, 1, 0.6, 8);

        if (updateNoise) {

            animDelta = THREE.Math.clamp(animDelta + 0.00075 * animDeltaDir, 0, 0.05);
            uniformsNoise['time'].value += delta * animDelta;

            uniformsNoise['offset'].value.x += delta * 0.05;

            uniformsTerrain['uOffset'].value.x = 4 * uniformsNoise['offset'].value.x;

            quadTarget.material = mlib['heightmap'];
            renderer.render(sceneRenderTarget, cameraOrtho, heightMap, true);

            quadTarget.material = mlib['normal'];
            renderer.render(sceneRenderTarget, cameraOrtho, normalMap, true);

        }

        renderer.render(scene, camera);

    }

}


///--------------user interactions-----------------------///

const canvas = document.querySelector('canvas');

const { width, height, x, y } = canvas.getBoundingClientRect();
canvas.onmousemove = (ev) => {
    const { clientX, clientY } = ev

    const precX = clientX / (width + x);
    const precY = clientY / (height + y);

    updateTypography({ x: precX, y: precY })
}

