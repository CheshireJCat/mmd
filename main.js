import * as THREE from "three";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper.js";

let mesh, camera, scene, renderer;
let helper;

let ready = false;

let clicked = false;

const clock = new THREE.Clock();

let status = document.getElementById("status");
let progressControl = {
    self: document.getElementById("progress"),
    progress_model: document.getElementById("progress_model"),
    progress_animation: document.getElementById("progress_animation"),
    progress_camera: document.getElementById("progress_camera"),
    progress_music: document.getElementById("progress_music"),
    changeProgress(name, p) {
        this.show();
        this[`progress_${name}`].innerText = p;
    },
    hide() {
        this.self.classList.add("hide");
    },
    show() {
        if (this.self.classList.contains("hide")) {
            this.self.classList.remove("hide");
        }
    },
};

function _onProgress(name) {
    return function onProgress(xhr) {
        if (xhr.lengthComputable) {
            const percentComplete = Math.floor((xhr.loaded / xhr.total) * 100);
            progressControl.changeProgress(name, percentComplete);
        }
    };
}

function changeStatus(text) {
    status.innerText = text || "";
}

let debug = false;

function start() {
    init(() => {
        changeStatus("即将开始...");
        ready = true;
        animate();
        changeStatus();
        progressControl.hide();
    });
}

status.addEventListener("click", function () {
    if (!ready && !clicked) {
        clicked = true;
        changeStatus("资源加载中...");
        Ammo().then(start);
    }
});

function init(callback) {
    const container = document.getElementById("container");

    camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        1,
        1500
    );

    // scene

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb7fde3);

    // scene.add(new THREE.PolarGridHelper(30, 0));
    const geometry = new THREE.CylinderGeometry(40, 42, 1, 30, 30);
    const material = new THREE.MeshMatcapMaterial({ color: 0xf1c4e3 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.translateY(-1);
    scene.add(mesh);

    const listener = new THREE.AudioListener();
    camera.add(listener);
    scene.add(camera);

    // light

    const ambient = new THREE.AmbientLight(0x777777);
    scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0x887766);
    directionalLight.position.set(0, 0, 10).normalize();
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // model

    const vmdFiles = ["./models/vmd/snow.vmd"];
    const audioFile = "./models/audio/snow.mp3";
    const cameraFiles = ["./models/vmd/camera.vmd"];
    const modelFile = "./models/role/miku/1.pmd";

    // const vmdFiles = ["models/vmd/elysion1.vmd"];
    // const audioFile = "models/audio/elysion.mp3";
    // const cameraFiles = ["models/vmd/camera1.vmd"];

    const audioParams = { delayTime: 0 };

    helper = new MMDAnimationHelper();

    const loader = new MMDLoader();
    const animationBuilder = loader.animationBuilder;

    if (!debug) {
        Promise.all([
            loadModel(modelFile),
            loadAnimation(vmdFiles),
            loadCamera(cameraFiles),
            loadMusic(audioFile),
        ]).then(([mesh, vmd, cameraAnimation, music]) => {
            let animation = animationBuilder.build(vmd, mesh);
            helper.add(mesh, {
                animation: animation,
                physics: true,
            });
            helper.add(camera, {
                animation: cameraAnimation,
            });
            helper.add(music, audioParams);
            scene.add(mesh);
            callback();
        });
    } else {
        callback();
    }

    function loadModel(url) {
        return new Promise((resolve) => {
            loader.load(
                url,
                function (model) {
                    resolve(model);
                },
                _onProgress("model"),
                null
            );
        });
    }

    function loadAnimation(url) {
        return new Promise((resolve) => {
            loader.loadVMD(
                url,
                function (animation) {
                    resolve(animation);
                },
                _onProgress("animation"),
                null
            );
        });
    }

    function loadCamera(url) {
        return new Promise((resolve) => {
            loader.loadAnimation(
                url,
                camera,
                function (cameraAnimation) {
                    resolve(cameraAnimation);
                },
                _onProgress("camera"),
                null
            );
        });
    }

    function loadMusic(url) {
        return new Promise((resolve) => {
            new THREE.AudioLoader().load(
                url,
                function (buffer) {
                    const audio = new THREE.Audio(listener).setBuffer(buffer);
                    resolve(audio);
                },
                _onProgress("music"),
                null
            );
        });
    }
    //

    window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    if (ready) {
        helper.update(clock.getDelta());
    }
    renderer.render(scene, camera);
}