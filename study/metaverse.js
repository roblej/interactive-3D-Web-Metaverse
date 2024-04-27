import * as THREE from '../build/three.module.js'
import {OrbitControls} from "../examples/jsm/controls/OrbitControls.js"
import {GLTFLoader} from "../examples/jsm/loaders/GLTFLoader.js"
import Stats from "../examples/jsm/libs/stats.module.js"
import { Octree } from "../examples/jsm/math/Octree.js"
import { Capsule } from "../examples/jsm/math/Capsule.js"
import { onMouseMove } from './event.js';


class App {
    constructor() {
    const divContainer = document.querySelector("#webgl-container");
    this._divContainer = divContainer;

    const renderer = new THREE.WebGLRenderer({ antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    divContainer.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    this._renderer = renderer;
    this._mixers = []; // 클래스의 생성자 또는 초기화 부분에 추가


    const scene = new THREE.Scene();
    this._scene = scene;
    const loader = new THREE.TextureLoader();
    this._scene.background = loader.load('./data/sky_images.jpeg');
    //this._scene.background = new THREE.Color(0x87CEEB); // 하늘색으로 설정

    this>this._setupOctree();
    this._setupCamera();
    this._setupLight();
    this._setupModel();
    this._setupControls();

    const listener = new THREE.AudioListener();
    this._camera.add(listener)
    const sound = new THREE.Audio(listener);

// 오디오 로더 생성
    const audioLoader = new THREE.AudioLoader();

// 오디오 파일 로드 및 재생
    document.getElementById('loginModal').addEventListener('click', function() {
        if (listener.context.state === 'suspended') {
            listener.context.resume(); // AudioContext 상태 확인 및 활성화
        }

            audioLoader.load('./data/bgm.mp3', function(buffer) {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.3);
                sound.play();
            });
        });
    // 볼륨 노브 컨트롤
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        sound.setVolume(volume);
    });

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._highlighted = null; // 마지막으로 강조 표시된 객체
    this._originalColor = new THREE.Color(); // 원래 색상을 저장할 변수
    this._positionLabel = document.getElementById("positionLabel");  // HTML에서 레이블 요소 참조
    // this._divContainer.addEventListener('mousemove', this._onMouseMove.bind(this));
    this._divContainer.addEventListener('mousemove', (event) => onMouseMove(event, this));
        
        // 마우스 클릭 이벤트 리스너 추가
    this._divContainer.addEventListener('click', this._onMouseClick.bind(this));

    window.onresize = this.resize.bind(this);
    this.resize();

    requestAnimationFrame(this.render.bind(this));
    }
    _updatePositionLabel() {
        if (this._model) {  // 모델이 로드된 경우에만 실행
            const { x, y, z } = this._model.position;
            this._positionLabel.innerHTML = `Model Position - X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}`;
        }
    }
    _setupOctree(){
        this._worldOctree = new Octree();
    }

    _setupControls(){
        this._controls = new OrbitControls(this._camera,this._divContainer);
        this._controls.target.set(0, 100, 0);
        this._controls.enablePan = false;
        this._controls.enableDamping = true;

        this._controls.minDistance = 300;  // 카메라가 대상에 가장 가까울 수 있는 거리
        this._controls.maxDistance = 1000;  // 카메라가 대상에서 가장 멀어질 수 있는 거리

        this._controls.minPolarAngle = Math.PI / 4;   // 카메라가 아래로 45도 이상 내려가지 못하게 설정
        this._controls.maxPolarAngle = Math.PI / 2;   // 카메라가 수평선 이상으로 올라가지 못하게 설정

        const stats = new Stats();
        this._divContainer.appendChild(stats.dom);
        this._fps = stats;

        this._pressKeys = {};

        document.addEventListener("keydown", (event) => {
            this._pressKeys[event.key.toLowerCase()]= true;
            this._processAnimation();
        });

        document.addEventListener("keyup", (event) => {
            this._pressKeys[event.key.toLowerCase()]= false;
            this._processAnimation();
        });
    }

    _processAnimation(){
        const previousAnimationAction = this._currentAnimationAction;

        if(this._pressKeys["w"] || this._pressKeys["a"] || this._pressKeys["s"] || this._pressKeys["d"]) {
            if(this._pressKeys["shift"] ){
                this._currentAnimationAction = this._animationMap["run"];
                // this._speed = 350;
                this._maxSpeed = 700;
                this._acceleration = 16;
            } else{
                this._currentAnimationAction = this._animationMap["walk"];
                // this._speed = 80;
                this._maxSpeed = 240;
                this._acceleration = 9;

            }
        }else{
            this._currentAnimationAction = this._animationMap["idle"];
            this._speed = 0;
            this._maxSpeed = 0;
            this._acceleration = 0;
        }

        if(previousAnimationAction !== this._currentAnimationAction){
            previousAnimationAction.fadeOut(0.5);
            this._currentAnimationAction.reset().fadeIn(0.5).play(); 
        }
    }

    _setupModel() {
        const planeGeometry = new THREE.PlaneGeometry(20000,20000);
        const planeMaterial = new THREE.MeshPhongMaterial({color: 0x0A630A});
        const NpcMaterial = new THREE.MeshPhongMaterial({color: 0x878787});
        const plane = new THREE.Mesh(planeGeometry,planeMaterial);
        plane.name = "plane";
        plane.rotation.x = -Math.PI/2;
        this._scene.add(plane);
        plane.receiveShadow = true;

        this._worldOctree.fromGraphNode(plane);
        new GLTFLoader().load("./data/town_protoglbsmaller.glb",(gltf) =>{
            const map = gltf.scene;
            this._scene.add(map);
            this.map = map;
            map.scale.set(50,50,50);
            map.rotation.y = Math.PI / 2; // Z축을 중심으로 90도 회전
            map.position.set(0,1,0);
            this._worldOctree.fromGraphNode(map);
        })
        new GLTFLoader().load("./data/walking_maru.glb",(gltf) =>{
            const npc = gltf.scene;
            this._scene.add(npc);
            
    
            npc.traverse(child =>{
                if(child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
                if (child.isMesh) {
                    child.userData.type = 'maru';
                }
            });
            // 애니메이션 믹서 설정
            const mixer = new THREE.AnimationMixer(npc);
            this._mixers.push(mixer);
            const animationsMap = {};
            gltf.animations.forEach((clip) => {
                console.log('마루움직임')
                console.log(clip.name);
                console.log('마루움직임')
                animationsMap[clip.name] = mixer.clipAction(clip);
            });
            npc.userData.animationsMap = animationsMap;
            npc.userData.mixer = mixer;
            // 'idle' 애니메이션 재생
            if (animationsMap['Body1|Unreal Take|Base Layer']) {
                const idleAction = animationsMap['Body1|Unreal Take|Base Layer'];
                idleAction.play();
            }
            // npc.position.set(100,0,-230);
            npc.scale.set(50,50,50);
            const box = (new THREE.Box3).setFromObject(npc);
            // npc.position.y = (box.max.y - box.min.y) /2;
            const height = box.max.y - box.min.y;
            const diameter = box.max.z - box.min.z
            
            npc._capsule = new Capsule(
                new THREE.Vector3(0, diameter/2, 0),
                new THREE.Vector3(0, height - diameter/2, 0),
                diameter/2
            );
            npc.rotation.y = Math.PI;
            this._npc = npc;
    }); 

        new GLTFLoader().load("./data/Xbot.glb",(gltf) =>{
            const npc = gltf.scene;
            this._scene.add(npc);
            
    
            npc.traverse(child =>{
                if(child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
                if (child.isMesh) {
                    child.userData.type = 'teacher';
                }
            });
            // 애니메이션 믹서 설정
            const mixer = new THREE.AnimationMixer(npc);
            this._mixers.push(mixer);
            const animationsMap = {};
            gltf.animations.forEach((clip) => {
                // console.log(clip.name);
                animationsMap[clip.name] = mixer.clipAction(clip);
            });
            npc.userData.animationsMap = animationsMap;
            npc.userData.mixer = mixer;
            // 'idle' 애니메이션 재생
            if (animationsMap['idle']) {
                const idleAction = animationsMap['idle'];
                idleAction.play();
            }
            npc.position.set(400,0,400);
            npc.scale.set(50,50,50);
            const box = (new THREE.Box3).setFromObject(npc);
            // npc.position.y = (box.max.y - box.min.y) /2;
            const height = box.max.y - box.min.y;
            const diameter = box.max.z - box.min.z
            
            npc._capsule = new Capsule(
                new THREE.Vector3(0, diameter/2, 0),
                new THREE.Vector3(0, height - diameter/2, 0),
                diameter/2
            );
            npc.rotation.y = Math.PI;
            this._npc = npc;
    }); 
    new GLTFLoader().load("./data/Xbot.glb",(gltf) =>{
        const npc = gltf.scene;
        this._scene.add(npc);
        

        npc.traverse(child =>{
            if(child instanceof THREE.Mesh) {
                child.castShadow = true;
            }
            if (child.isMesh) {
                child.userData.type = 'teacher';
            }
        });
        // 애니메이션 믹서 설정
        const mixer = new THREE.AnimationMixer(npc);
        this._mixers.push(mixer);
        const animationsMap = {};
        gltf.animations.forEach((clip) => {
            // console.log(clip.name);
            animationsMap[clip.name] = mixer.clipAction(clip);
        });
        npc.userData.animationsMap = animationsMap;
        npc.userData.mixer = mixer;
        // 'idle' 애니메이션 재생
        if (animationsMap['idle']) {
            const idleAction = animationsMap['idle'];
            idleAction.play();
        }
        npc.position.set(2300,30,60);
        npc.scale.set(50,50,50);
        const box = (new THREE.Box3).setFromObject(npc);
        // npc.position.y = (box.max.y - box.min.y) /2;
        const height = box.max.y - box.min.y;
        const diameter = box.max.z - box.min.z
        
        npc._capsule = new Capsule(
            new THREE.Vector3(0, diameter/2, 0),
            new THREE.Vector3(0, height - diameter/2, 0),
            diameter/2
        );
        // npc.rotation.y = Math.PI;
        this._npc = npc;
}); 
new GLTFLoader().load("./data/Xbot.glb",(gltf) =>{
    const npc = gltf.scene;
    this._scene.add(npc);
    

    npc.traverse(child =>{
        if(child instanceof THREE.Mesh) {
            child.castShadow = true;
        }
        if (child.isMesh) {
            child.userData.type = 'npc3';
        }
    });
    // 애니메이션 믹서 설정
    const mixer = new THREE.AnimationMixer(npc);
    this._mixers.push(mixer);
    const animationsMap = {};
    gltf.animations.forEach((clip) => {
        // console.log(clip.name);
        animationsMap[clip.name] = mixer.clipAction(clip);
    });
    npc.userData.animationsMap = animationsMap;
    npc.userData.mixer = mixer;
    // 'idle' 애니메이션 재생
    if (animationsMap['idle']) {
        const idleAction = animationsMap['idle'];
        idleAction.play();
    }
    npc.position.set(360,1,2341);
    npc.scale.set(70,70,70);
    const box = (new THREE.Box3).setFromObject(npc);
    // npc.position.y = (box.max.y - box.min.y) /2;
    const height = box.max.y - box.min.y;
    const diameter = box.max.z - box.min.z
    
    npc._capsule = new Capsule(
        new THREE.Vector3(0, diameter/2, 0),
        new THREE.Vector3(0, height - diameter/2, 0),
        diameter/2
    );
    npc.rotation.y = Math.PI/2;
    this._npc = npc;
}); 
new GLTFLoader().load("./data/Xbot.glb",(gltf) =>{
    const npc = gltf.scene;
    this._scene.add(npc);
    

    npc.traverse(child =>{
        if(child instanceof THREE.Mesh) {
            child.castShadow = true;
        }
        if (child.isMesh) {
            child.userData.type = 'teacher';
        }
    });
    // 애니메이션 믹서 설정
    const mixer = new THREE.AnimationMixer(npc);
    this._mixers.push(mixer);
    const animationsMap = {};
    gltf.animations.forEach((clip) => {
        // console.log(clip.name);
        animationsMap[clip.name] = mixer.clipAction(clip);
    });
    npc.userData.animationsMap = animationsMap;
    npc.userData.mixer = mixer;
    // 'idle' 애니메이션 재생
    if (animationsMap['idle']) {
        const idleAction = animationsMap['idle'];
        idleAction.play();
    }
    npc.position.set(-2222,0,1297);
    npc.scale.set(70,70,70);
    const box = (new THREE.Box3).setFromObject(npc);
    // npc.position.y = (box.max.y - box.min.y) /2;
    const height = box.max.y - box.min.y;
    const diameter = box.max.z - box.min.z
    
    npc._capsule = new Capsule(
        new THREE.Vector3(0, diameter/2, 0),
        new THREE.Vector3(0, height - diameter/2, 0),
        diameter/2
    );
    npc.rotation.y = Math.PI/2;
    this._npc = npc;
}); 
    new GLTFLoader().load("./data/Xbot.glb",(gltf) =>{

        const npc = gltf.scene;
        this._scene.add(npc);
        

        npc.traverse(child =>{
            if(child instanceof THREE.Mesh) {
                child.castShadow = true;
            }
            if (child.isMesh) {
                child.userData.type = 'casher';
            }
        });
        // 애니메이션 믹서 설정
        const mixer = new THREE.AnimationMixer(npc);
        this._mixers.push(mixer);
        const animationsMap = {};
        gltf.animations.forEach((clip) => {
            // console.log(clip.name);
            animationsMap[clip.name] = mixer.clipAction(clip);
        });
        npc.userData.animationsMap = animationsMap;
        npc.userData.mixer = mixer;
        // 'idle' 애니메이션 재생
        if (animationsMap['idle']) {
            const idleAction = animationsMap['idle'];
            idleAction.play();
        }

        npc.position.set(0,0,-2300);
        npc.scale.set(70,70,70);
        const box = (new THREE.Box3).setFromObject(npc);
        // npc.position.y = 0;
        const height = box.max.y - box.min.y;
        const diameter = box.max.z - box.min.z
        
        npc._capsule = new Capsule(
            new THREE.Vector3(0, diameter/2, 0),
            new THREE.Vector3(0, height - diameter/2, 0),
            diameter/2
        );
        // npc.rotation.y = Math.PI;
        this._npc = npc;
}); 


    new GLTFLoader().load("./data/Xbot.glb", (gltf) => {
        const model = gltf.scene;
        this._scene.add(model);

        model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
            }
        });

        
        const animationClips = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        this._mixers.push(mixer);
        const animationsMap = {};
        animationClips.forEach(clip => {
            const name = clip.name;
            animationsMap[name] = mixer.clipAction(clip);
        });
        
        this._mixer = mixer;
        this._animationMap = animationsMap;
        this._currentAnimationAction = this._animationMap["idle"];
        this._currentAnimationAction.play();
        
        const box = new THREE.Box3().setFromObject(model);
        const height = box.max.y - box.min.y;
        const diameter = box.max.z - box.min.z;
        
        model._capsule = new Capsule(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, height, 0),
            (diameter/2)*50
        );
        
        model.scale.set(50, 50, 50);
            const axisHelper = new THREE.AxesHelper(1000);
            this._scene.add(axisHelper)
            const boxHelper = new THREE.BoxHelper(model);
            this._scene.add(boxHelper);
            this._boxHelper = boxHelper;
            this._model = model;
        });
            const boxG = new THREE.BoxGeometry(50, 50, 50);
            const boxM = new THREE.Mesh(boxG, NpcMaterial);
            boxM.receiveShadow = true;
            boxM.castShadow = true;
            boxM.position.set(150, 0, 0);
            boxM.name = "clickableBox"; // 식별 가능한 name 속성 추가
            this._scene.add(boxM);
            this._worldOctree.fromGraphNode(boxM);
            this._boxM = boxM;

            const GameA = new THREE.Mesh(boxG, NpcMaterial);
            GameA.receiveShadow = true;
            GameA.castShadow = true;
            GameA.position.set(76, 0, -2300);
            GameA.name = "GameA"; // 식별 가능한 name 속성 추가
            this._scene.add(GameA);
            this._worldOctree.fromGraphNode(GameA);


            const boxT = new THREE.Mesh(boxG, NpcMaterial);
            boxT.receiveShadow = true;
            boxT.castShadow = true;
            boxT.position.set(-150, 0, 0);
            boxT.name = "tp";
            this._scene.add(boxT);
            this._boxT= boxT;
            this._worldOctree.fromGraphNode(boxT);
    }

    _onMouseClick(event) {
        // 마우스 위치를 정규화된 장치 좌표로 변환
        this._mouse.x = ( event.clientX / this._divContainer.clientWidth ) * 2 - 1;
        this._mouse.y = - ( event.clientY / this._divContainer.clientHeight ) * 2 + 1;
    
        // Raycaster 업데이트
        this._raycaster.setFromCamera(this._mouse, this._camera);
    
        // 클릭된 객체 확인
        const intersects = this._raycaster.intersectObjects(this._scene.children, true);
        for (let i = 0; i < intersects.length; i++) {
            const selectedObject = intersects[0].object;
            if (selectedObject.userData.type == 'teacher') {
                console.log(selectedObject.userData.type)
            }
            if (selectedObject.userData.type === 'casher') {
              
                // console.log(selectedObject.userData.type);
                
                var casher = document.getElementById("thiscasher");
                var span = document.getElementsByClassName("close")[1];
                var speechText = document.getElementById("speechText");
                var buttonGroup = document.getElementById("buttonGroup");
        
                casher.style.display = "block";

                // 모달을 초기 상태로 재설정하는 함수
                function resetModal() {
                    speechText.style.display = "block"; // 텍스트 보이기
                    buttonGroup.style.display = "none" // 버튼 그룹 숨기기
                }

                // 초기 상태로 모달 재설정
                resetModal();
        
                // 닫기 버튼 클릭 시 모달 닫기
                span.onclick = function() {
                    casher.style.display = "none";
                    resetModal();
                }

                 // 텍스트 클릭 시 텍스트 숨기기 및 버튼 그룹 보이기
                speechText.onclick = function() {
                    speechText.style.display = "none"; // 텍스트 숨김
                    buttonGroup.style.display = "block"; // 버튼 그룹 표시
                }
        
                // 선택지 1 클릭 시 동작
                document.getElementById("select1").onclick = function() {
                    console.log("선택지 1 선택됨");
                    casher.style.display = "none";
                    resetModal();
                }
        
                // 선택지 2 클릭 시 동작
                document.getElementById("select2").onclick = function() {
                    console.log("선택지 2 선택됨");
                    casher.style.display = "none";
                    resetModal();
                }

                // 선택지 3 클릭 시 동작
                document.getElementById("select3").onclick = function() {
                    console.log("선택지 3 선택됨");
                    casher.style.display = "none";
                    resetModal();
                }
        
                // 모달 창 바깥 영역 클릭 시 모달 닫기
                window.onclick = function(event) {
                    if (event.target == casher) {
                        casher.style.display = "none";
                        resetModal();
                    }
                }
    
            break; // 첫 번째 교차 객체만 처리하고 루프 종료

        //         // 올바른 animationsMap 참조를 확인
        //         let npcObject = selectedObject;
        //         while (npcObject.parent && !npcObject.userData.animationsMap) {
        //             npcObject = npcObject.parent;  // 부모를 거슬러 올라가며 검사
        //         }
        //         if (npcObject.userData.animationsMap) {
        //             const mixer = npcObject.userData.mixer;
        //             const walkAction = npcObject.userData.animationsMap['walk'];
        //             const idleAction = npcObject.userData.animationsMap['idle'];
            
        //             // 모든 애니메이션 중지 및 'walk' 애니메이션 재생
        //             // mixer.stopAllAction();
        //             walkAction.play();

        // // 'walk' 애니메이션의 완료 이벤트 리스너 설정
        //             walkAction.clampWhenFinished = true; // 애니메이션 완료 후 마지막 포즈 유지
        //             walkAction.loop = THREE.LoopOnce; // 애니메이션을 한 번만 재생
        //             // mixer.addEventListener('finished', function(e) {
        //             //     if (e.action === walkAction) {
        //             idleAction.play(); // 'walk' 애니메이션이 끝나면 'idle' 애니메이션 재생
                    
                
        //     }
            }
            else if (selectedObject.userData.type == 'teacher') {
                var casher = document.getElementById("thiscasher");
                var span = document.getElementsByClassName("close")[1];
                var dialogText = document.querySelector("#thiscasher .Speech1 p");
                var option1 = document.getElementById("select1");
                var option2 = document.getElementById("select2");
                var option3 = document.getElementById("select3");
                var buttonGroup = document.getElementById("buttonGroup"); // 버튼 그룹을 감싸고 있는 div의 ID를 가정

            
                // 대화 내용 업데이트
                dialogText.innerHTML = "안녕? 나는 선생님이야.";
            
                // 각 선택지 업데이트
                function resetModal() {
                    option1.innerHTML = "안녕하세요";
                    option2.innerHTML = "그런데요?";
                    option3.innerHTML = "아저씨 저 아세요?";
                    dialogText.style.display = "block";  // 텍스트를 보이게 함
                    buttonGroup.style.display = "none";  // 버튼 그룹을 숨김
                }

                // 초기 상태로 모달 재설정
                resetModal();

                casher.style.display = "block";

                // 텍스트 클릭 시 텍스트 숨기기 및 버튼 그룹 보이기
                dialogText.onclick = function() {
                    this.style.display = "none"; // 텍스트 숨김
                    buttonGroup.style.display = "block"; // 버튼 그룹 표시
                };
            
                // 닫기 버튼 클릭 시 모달 닫기
                span.onclick = function() {
                    casher.style.display = "none";
                    resetModal();
                };
            
                // 각 선택지 클릭 시 동작
                option1.onclick = function() {
                    console.log("첫 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                option2.onclick = function() {
                    console.log("두 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                option3.onclick = function() {
                    console.log("세 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                // 모달 창 바깥 영역 클릭 시 모달 닫기
                window.onclick = function(event) {
                    if (event.target == casher) {
                        casher.style.display = "none";
                        resetModal();
                    }
                };
            }
            else if (selectedObject.userData.type == 'npc3') {
                var casher = document.getElementById("thiscasher");
                var span = document.getElementsByClassName("close")[1];
                var dialogText = document.querySelector("#thiscasher .Speech1 p");
                var option1 = document.getElementById("select1");
                var option2 = document.getElementById("select2");
                var option3 = document.getElementById("select3");
                var buttonGroup = document.getElementById("buttonGroup"); // 버튼 그룹을 감싸고 있는 div의 ID를 가정


                // 대화 내용 업데이트
                dialogText.innerHTML = "안녕? 나는 npc3야.";
            
                // 각 선택지 업데이트
                function resetModal() {
                    option1.innerHTML = "안녕하세요";
                    option2.innerHTML = "와 AI다!?";
                    option3.innerHTML = "집에가고싶어요";
                    dialogText.style.display = "block";  // 텍스트를 보이게 함
                    buttonGroup.style.display = "none";  // 버튼 그룹을 숨김
                }

                // 초기 상태로 모달 재설정
                resetModal();

                casher.style.display = "block";

                // 텍스트 클릭 시 텍스트 숨기기 및 버튼 그룹 보이기
                dialogText.onclick = function() {
                    this.style.display = "none"; // 텍스트 숨김
                    buttonGroup.style.display = "block"; // 버튼 그룹 표시
                };
            
                // 닫기 버튼 클릭 시 모달 닫기
                span.onclick = function() {
                    casher.style.display = "none";
                    resetModal();
                };
            
                // 각 선택지 클릭 시 동작
                option1.onclick = function() {
                    console.log("첫 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                option2.onclick = function() {
                    console.log("두 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                option3.onclick = function() {
                    console.log("세 번째 선택지 선택됨");
                    casher.style.display = "none";
                    resetModal();
                };
            
                // 모달 창 바깥 영역 클릭 시 모달 닫기
                window.onclick = function(event) {
                    if (event.target == casher) {
                        casher.style.display = "none";
                        resetModal();
                    }
                };
            }
            

            
        // if (intersects[i].object.name !== "plane")
        //     console.log(intersects[i].object.name);
            if (intersects[i].object.name === "clickableBox") {
                var modal = document.getElementById("myModal");
                var span = document.getElementsByClassName("close")[0];
        
                modal.style.display = "block";
        
                // 닫기 버튼 클릭 시 모달 닫기
                span.onclick = function() {
                    modal.style.display = "none";
                }
        
                // 선택지 1 클릭 시 동작
                document.getElementById("option1").onclick = function() {
                    console.log("선택지 1 선택됨");
                    modal.style.display = "none";
                }
        
                // 선택지 2 클릭 시 동작
                document.getElementById("option2").onclick = function() {
                    console.log("선택지 2 선택됨");
                    modal.style.display = "none";
                }
        
                // 모달 창 바깥 영역 클릭 시 모달 닫기
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
    
            break; // 첫 번째 교차 객체만 처리하고 루프 종료
            }
            else if (intersects[i].object.name === "GameA") {
                var modal = document.getElementById("myModal");
                var span = document.getElementsByClassName("close")[0];
        
                modal.style.display = "block";
        
                // 닫기 버튼 클릭 시 모달 닫기
                span.onclick = function() {
                    modal.style.display = "none";
                }
        
                // 선택지 1 클릭 시 동작
                document.getElementById("option1").onclick = function() {
                    console.log("선택지 1 선택됨");
                    modal.style.display = "none";
                }
        
                // 선택지 2 클릭 시 동작
                document.getElementById("option2").onclick = function() {
                    console.log("선택지 2 선택됨");
                    modal.style.display = "none";
                }
        
                // 모달 창 바깥 영역 클릭 시 모달 닫기
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
    
            break; // 첫 번째 교차 객체만 처리하고 루프 종료
            
        }
        if (intersects[i].object.name === "tp") {
            // 캐릭터의 새 위치 설정
            this._model.position.x = 0;
            this._model.position.z = 800;
        
            // 캐릭터의 현재 y 위치를 유지하면서 캡슐 위치 업데이트
            const heightOffset = (this._model._capsule.end.y - this._model._capsule.start.y) / 2;
            this._model._capsule.start.set(this._model.position.x, this._model.position.y, this._model.position.z);
            this._model._capsule.end.set(this._model.position.x, this._model.position.y + heightOffset * 2, this._model.position.z);
        }
        
    }
}


    _setupCamera(){
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            20000
        );
        camera.position.set(0, 100, 500);
        this._camera = camera;
    }

    _addPointLight(x, y, z, helperColor) {
        const color = 0xffffff;
        const intensity = 900000;
    
        const pointLight = new THREE.PointLight(color, intensity, 2000);
        pointLight.position.set(x, y, z);
    
        this._scene.add(pointLight);
    
        const pointLightHelper = new THREE.PointLightHelper(pointLight, 10, helperColor);
        this._scene.add(pointLightHelper);
    }

    _setupLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this._scene.add(ambientLight);
        // this._addPointLight(500, 150, 500, 0xff0000);
        // this._addPointLight(-500, 150, 500, 0xffff00);
        // this._addPointLight(-500, 150, -500, 0x00ff00);
        // this._addPointLight(500, 150, -500, 0x0000ff);

        const shadowLight = new THREE.DirectionalLight(0xffffff, 0.2);
        shadowLight.position.set(200, 500, 200);
        shadowLight.target.position.set(0, 0, 0);
        const directionalLightHelper = new THREE.DirectionalLightHelper(shadowLight, 10);
        // this._scene.add(directionalLightHelper);
        
        this._scene.add(shadowLight);
        this._scene.add(shadowLight.target);

        shadowLight.castShadow = true;
        shadowLight.shadow.mapSize.width = 1024;
        shadowLight.shadow.mapSize.height = 1024;
        shadowLight.shadow.camera.top = shadowLight.shadow.camera.right = 700;
        shadowLight.shadow.camera.bottom = shadowLight.shadow.camera.left = -700;
        shadowLight.shadow.camera.near = 100;
        shadowLight.shadow.camera.far = 900;
        shadowLight.shadow.radius = 5;
        const shadowCameraHelper = new THREE.CameraHelper(shadowLight.shadow.camera);
        // this._scene.add(shadowCameraHelper);
    }
    
    _previousDirectionOffset = 0;

    _directionOffset(){
        const pressedKeys = this._pressKeys;
        let directionoffset = 0
        if(pressedKeys['w']){
            if(pressedKeys['a']){
                directionoffset = Math.PI / 4
            }else if (pressedKeys['d']){
                directionoffset = - Math.PI / 4
            }
        } else if (pressedKeys['s']){
            if(pressedKeys['a']){
                directionoffset = Math.PI / 4 + Math.PI /2
            }else if (pressedKeys['d']){
                directionoffset = - Math.PI / 4 - Math.PI /2
            } else {
                directionoffset = Math.PI
            }
    } else if (pressedKeys['a']){
        directionoffset = Math.PI /2
    } else if (pressedKeys['d']){
        directionoffset = - Math.PI /2
    } else {
        directionoffset = this._previousDirectionOffset;
    }
    this._previousDirectionOffset = directionoffset;

        return directionoffset;
}

    _speed = 0;
    _maxSpeed = 0;
    _acceleration = 0;
    _bOnTheGround = false;
    _fallingAcceleration = 0;
    _fallingSpeed = 0;

       update(time) {
        time *= 0.001;
        this._controls.update();
        
        if(this._boxHelper){
            this._boxHelper.update();
        }

        this._fps.update();

        if(this._mixer) {
            const deltaTime = time - this._previousTime;
            this._mixers.forEach(mixer => mixer.update(deltaTime));

            const angleCameraDirectionAxisY=Math.atan2(
                (this._camera.position.x - this._model.position.x),
                (this._camera.position.z -  this._model.position.z)
            )+ Math.PI;

            const rotateQuarternion = new THREE.Quaternion();
            rotateQuarternion.setFromAxisAngle(
                new THREE.Vector3(0,1,0),
                angleCameraDirectionAxisY + this._directionOffset()
            );

            this._model.quaternion.rotateTowards(rotateQuarternion, THREE.MathUtils.degToRad(5));

            const walkDirection = new THREE.Vector3();
            this._camera.getWorldDirection(walkDirection);

            walkDirection.y = this._bOnTheGround ? 0 : -1;
            walkDirection.normalize();

            walkDirection.applyAxisAngle(new THREE.Vector3(0,1,0), this._directionOffset());

            if(this._speed < this._maxSpeed) this._speed += this._acceleration
            else this._speed -= this._acceleration*2;

            if(!this._bOnTheGround){
                this._fallingAcceleration+=1;
                this._fallingSpeed+= Math.pow(this._fallingAcceleration, 2);
            } else{
                this._fallingAcceleration = 0;
                this._fallingSpeed = 0;
            }

            const velocity = new THREE.Vector3(
                walkDirection.x * this._speed,
                walkDirection.y * this._fallingSpeed,
                walkDirection.z * this._speed,
            );

            const deltaPosition = velocity.clone().multiplyScalar(deltaTime);

            this._model._capsule.translate(deltaPosition);

            const result = this._worldOctree.capsuleIntersect(this._model._capsule);
            if(result){
                this._model._capsule.translate(result.normal.multiplyScalar(result.depth));
                this._bOnTheGround = true;
            } else{
                this._bOnTheGround = false;
            }

            const previousPosition = this._model.position.clone();
            const capsuleHeight = this._model._capsule.end.y - this._model._capsule.start.y + this._model._capsule.radius*2;
            this._model.position.set(
            this._model._capsule.start.x,
            this._model._capsule.start.y - this._model._capsule.radius + capsuleHeight/2,
            this._model._capsule.start.z
            );

            this._camera.position.x -= previousPosition.x - this._model.position.x;
            this._camera.position.z -= previousPosition.z - this._model.position.z;

            this._controls.target.set(
                this._model.position.x,
                this._model.position.y,
                this._model.position.z,
            )

        }
        this._previousTime = time;
    }


    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);
        this._updatePositionLabel();  // 좌표 업데이트 함수 호출
        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

}


window.onload = function() {
    new App();
}
