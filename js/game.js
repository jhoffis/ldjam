"use strict";
/*

En bredde er 1.01 i dette kordinatsystemet.

 */
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let keys = {
    W: {pressed: false, released: false},
    A: {pressed: false, released: false},
    S: {pressed: false, released: false},
    D: {pressed: false, released: false},
    SHIFT: {pressed: false, released: false},
};

camera.position.z = 5;
let renderer = new THREE.WebGLRenderer({antialias: false});
renderer.setClearColor(0x253d46, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


let light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(0, 10, 0);
light.castShadow = true;
scene.add(light);

let ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;


//CHARACTERS
let characters = [];

//PLAYER


let player;
let canJump = false;
let deathCountCount = 0;
let deathCountElement = document.getElementById("death-count");
deathCountElement.innerHTML = "Death counter: " + deathCountCount;

function incrementDeathCounter() {
    deathCountCount++;
    deathCountElement.innerHTML = "Death counter: " + deathCountCount;
}

//ENEMIES OF THE STATE


//SPIKE
// let loader = new THREE.GLTFLoader();
// let spike;
//
// loader.load('res/spike.glb', function (gltf) {
//
//     spike = gltf.scene.getObjectByName("Cube");
//     let scale = 0.3;
//     spike.scale.set(scale, scale, scale);
//     gltf.scene.position.set(10, 10, 10)
//     scene.add(gltf.scene);
//
// }, undefined, function (error) {
//
//     console.error(error);
//
// });

//COLLIDERS

let colliders;


function createTile(r, g, b, x, y) {

    let tile = null;
    let url = null;
    let interaction = null;

    if (r === 0, g === 0, b === 0) {
        //Brick
        url = "res/tiles/brickfill.png";
    } else if (b === 120) {
        //Spikes
        interaction = () => player.die();
        url = "res/tiles/spikes.png";
    } else if (b === 200) {
        //Finish
        interaction = () => finishLevel();
        url = "res/tiles/finish.png";
    }


    if (url !== null)
        tile = new Tile(url, new THREE.Vector2(x, y), interaction);

    return tile;
}

function createCollider(tile) {
    scene.add(tile.sprite);
    colliders[tile.position.x][tile.position.y] = tile;
}

//LEVELs

let running = false;
let finishTextMesh = null;
let music = null;
let musicPlaying = false;

let LVLImg = new MarvinImage();
let LVL = 1;
const maxLVL = 2;

function loadLVL() {
    LVLImg.load("res/maps/map" + LVL + ".png", initLVL);
}

function initLVL() {
    if (LVL < maxLVL) {

        LVL++;
        if (colliders != null) {
            colliders.forEach((row) => {
                row.forEach((collider) => {
                    scene.remove(collider.sprite);
                })
            })
        }
        colliders = [...Array(LVLImg.getWidth())].map(e => Array(LVLImg.getHeight()))
        let imgY;
        for (let x = 0; x < LVLImg.getWidth(); x++) {
            imgY = LVLImg.getHeight() - 1;
            for (let y = 0; y < LVLImg.getHeight(); y++) {
                let r = LVLImg.getIntComponent0(x, imgY);
                let g = LVLImg.getIntComponent1(x, imgY);
                let b = LVLImg.getIntComponent2(x, imgY);

                if (g === 0) {

                    let tile = createTile(r, g, b, x, y);
                    if (tile !== null)
                        createCollider(tile);

                } else {
                    //characters
                    if (g === 200) {
                        //Player

                        let spriteMap2 = new THREE.TextureLoader().load("res/char/jump0.png");
                        spriteMap2.magFilter = THREE.NearestFilter;

                        let characterAnimation = new SpriteAnimator([{url: "res/char/idle", amount: "2", type: ".png"},
                            {url: "res/char/walk", amount: "2", type: ".png"},
                            {url: "res/char/jump", amount: "1", type: ".png"},
                            {url: "res/char/fall", amount: "1", type: ".png"},
                            {url: "res/char/fallwalk", amount: "1", type: ".png"},]);


                        let spriteMaterial = new THREE.SpriteMaterial({map: spriteMap2});
                        characterAnimation.playAnimationOnMaterial(0, spriteMaterial, 2);
                        let playerSprite = new THREE.Sprite(spriteMaterial);

                        if (player == null) {
                            player = new Character(playerSprite, new THREE.Vector2(x, y), characterAnimation, new THREE.Vector2(0.5, 1));
                            scene.add(player.sprite);
                            characters.push(player)
                        } else {
                            player.position.set(x, y);
                            player.spawn.set(x, y);
                        }
                    }
                }


                imgY--;
            }
        }

        if (music == null) {
            music = new Sound("res/sounds/ldjam.mp3");

        }

        running = true;
        animate();

    } else {
        //Finish off game
    }

}

loadLVL()


// UPDATES

function animate() {
    if (running) {
        if (keys.W.pressed) {
            if (canJump || player.fallingCount === 0) {
                canJump = true;
                player.jump();
            }
        } else if (keys.W.released) {
            canJump = false;
            keys.W.released = false;
        }

        if (keys.A.pressed) {
            player.walk(keys.SHIFT.pressed, -1);
        } else if (keys.A.released) {
            player.stopWalking();
            keys.A.released = false;
        }

        if (keys.D.pressed) {
            player.walk(keys.SHIFT.pressed, 1);
            if (!musicPlaying) {
                music.loop();
                musicPlaying = true;

            }
        } else if (keys.D.released) {
            player.stopWalking();
            keys.D.released = false;
        }


        //Go through all characters and check if their y coor is within an collider.
        // Use character array with collider array.
        //Perhaps only check colliders that have key within x position of char in case of
        // checking y and visa versa for checking x colliders.

        characters.forEach(checkCollition);

        camera.translateX((player.position.x - camera.position.x) / 5);
        camera.translateY((player.position.y - camera.position.y) / 5);

        if (finishTextMesh !== null) {
            finishTextMesh.position.set(camera.position.x, camera.position.y, 0);
            finishTextMesh.rotation.y += 0.01;
        }

        renderer.render(scene, camera);

        requestAnimationFrame(animate);
    }
}

function checkCollition(item) {

    if (item.isWithinColliderX(colliders, item.position, item.size)) {
        item.stopWalking();
        item.standByOnUnder(item.sideCollider);
    }

    //If falling increment falling in class
    if (!checkFalling(item)) {
        item.fall();
        checkFalling(item);
    }


    item.updateSprite();
}

function checkFalling(item) {
    if (item.isWithinColliderY(colliders, item.position, item.size)) {
        item.standByOnUnder(item.underCollider);
        return true;
    }
    return false;
}

function finishLevel() {
    if (finishTextMesh === null) {
        new Sound("res/sounds/ldjamwin.mp3").play();

        let loader = new THREE.FontLoader();

        loader.load('res/helvetiker_regular.typeface.json', function (font) {
            let finishText = new THREE.TextGeometry("You Won!", {
                font: font,
                size: 1,
                height: 1,
                curveSegments: 2,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 3,
                bevelOffset: 0,
                bevelSegments: 2

            });

            let textMaterial = new THREE.MeshPhongMaterial(
                {color: 0xff0000, specular: 0xffffff}
            );

            finishTextMesh = new THREE.Mesh(finishText, textMaterial);

            scene.add(finishTextMesh);

        });

        window.setTimeout(() => {
            running = false;
            finishTextMesh = null;
            loadLVL();
        }, 3000);

        return true;
    }

    return false;
}

class Sound {
    constructor(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function () {
            const playPromise = this.sound.play();
            if (playPromise !== null) {
                playPromise.catch(() => {
                    this.sound.play();
                })
            }
        }
        this.stop = function () {
            this.sound.pause();
        }
        this.loop = function () {
            this.sound.loop = true;
            this.play();
        }
    }
}


