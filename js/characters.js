"use strict";

let deltaTime = 16;

class SpriteAnimator {
    //En array med objekter som inneholder url og antall og type.
    constructor(arr) {
        this.animations = [];
        for (let i = 0; i < arr.length; i++) {
            this.saveAnimation(arr[i].url, arr[i].amount, arr[i].type);
        }
        this.currentAnimation = -1;
    }

    saveAnimation(url, amount, type) {
        let anim = [];
        for (let i = 0; i < amount; i++) {
            let fullUrl = new String(url + i + type);
            let spriteMap = new THREE.TextureLoader().load(fullUrl);
            spriteMap.magFilter = THREE.NearestFilter;
            anim[i] = spriteMap;
        }
        this.animations[this.animations.length] = anim;
    }

    stopAnimation() {
        clearInterval(this.animationInterval);
        this.currentAnimation = -1;
    }

    playAnimationOnMaterial(index, material, fps) {
        this.material = material;
        this.playAnimation(index, fps)
    }

    playAnimation(index, fps){
        //Check
        if (index >= this.animations.length || index < 0) {
            console.error("FAILED TO START ANIMATION BECAUSE INDEX: " + index);
            return;
        }

        //End old animation

        deltaTime = fps;

        //Set up
        this.currentAnimation = index;
        this.currentFrame = 0;

        //Start new
        //Start new
        this.animationInterval = () => {

            this.currentTextureMap = this.animations[this.currentAnimation][this.currentFrame];
            this.material.map = this.currentTextureMap;
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
            setTimeout(this.animationInterval, 1000 / deltaTime);
        }
        this.animationInterval();
    }

    setIndexAnim(index, fps) {
        if (index >= this.animations.length || index < 0) {
            console.error("FAILED TO START ANIMATION BECAUSE INDEX: " + index);
            return;
        }

        if (this.currentAnimation === index)
            return;

        deltaTime = fps;

        this.currentAnimation = index;
        this.currentFrame = 0;
    }

}

class Character {
    constructor(_sprite, _position, animation, size = new THREE.Vector2(1, 1)) {
        this.spawn = new THREE.Vector2(_position.x, _position.y);
        this.sprite = _sprite;
        this.size = size;
        this.sprite.scale.set(size.x, size.y);
        this.position = _position;
        this.animation = animation;


        this.verticalMovement = {value: 0, max: 0.1, min: -0.15};
        this.fallingCount = 0;
        this.fallingMax = 20;

        this.walkingSpeed = 0;
        this.walkingCount = 0;
        this.walkingMax = 4;
        this.walkingAcceleration = 0.005;
    }

    jump() {
        if (this.fallingCount < this.fallingMax && this.verticalMovement.value < this.verticalMovement.max)
            this.verticalMovement.value += 0.04 / (this.fallingCount + 1);
        this.position.y += this.verticalMovement.value;

        if(this.fallingCount === 0){
            new Sound("res/sounds/ldjamjump.mp3").play();
        }
    }

    stopJumping() {
        this.fallingCount = this.fallingMax;
    }

    fall() {
        if (this.fallingCount < this.fallingMax) {
            this.fallingCount++;
        }

        if (this.verticalMovement.value > this.verticalMovement.min)
            this.verticalMovement.value -= 0.0005 * this.fallingCount;
        this.position.y += this.verticalMovement.value;
    }

    stopFalling() {
        this.verticalMovement.value = 0;
        this.fallingCount = 0;
    }

    standByOnUnder(tile) {

        if (tile.interaction !== null) {
            if (tile.interaction())
                return;
        }


        if (this.position.y - tile.position.y > 0) {
            //You're above!
            let feet = new THREE.Vector2(this.position.x, this.position.y - this.size.y / 2);
            let leftCorner = new THREE.Vector2(tile.position.x - tile.size.x / 2, tile.position.y + tile.size.y / 2);
            let rightCorner = new THREE.Vector2(tile.position.x + tile.size.x / 2, tile.position.y + tile.size.y / 2);

            let feetComparedToLeft = (feet.x - tile.position.x) * (leftCorner.y - tile.position.y) - (feet.y - tile.position.y) * (leftCorner.x - tile.position.x);
            let feetComparedToRight = (feet.x - tile.position.x) * (rightCorner.y - tile.position.y) - (feet.y - tile.position.y) * (rightCorner.x - tile.position.x);

            if (Math.abs(feet.y - leftCorner.y) >= 0.05) {
                if (feetComparedToLeft < 0) {
                    this.position.x = tile.position.x - tile.size.x / 2 - this.size.x / 2;
                } else if (feetComparedToRight > 0) {
                    this.position.x = tile.position.x + tile.size.x / 2 + this.size.x / 2;
                } else {
                    this.stopFalling();
                    this.position.y = tile.position.y + tile.size.y / 2 + this.size.y / 2;
                }
            } else {
                this.stopFalling();
                this.position.y = tile.position.y + tile.size.y / 2 + this.size.y / 2;
            }

        } else {
            //You're below!
            let head = new THREE.Vector2(this.position.x, this.position.y + this.size.y / 2);
            let leftCorner = new THREE.Vector2(tile.position.x - tile.size.x / 2, tile.position.y - tile.size.y / 2);
            let rightCorner = new THREE.Vector2(tile.position.x + tile.size.x / 2, tile.position.y - tile.size.y / 2);

            let headComparedToLeft = (head.x - tile.position.x) * (leftCorner.y - tile.position.y) - (head.y - tile.position.y) * (leftCorner.x - tile.position.x);
            let headComparedToRight = (head.x - tile.position.x) * (rightCorner.y - tile.position.y) - (head.y - tile.position.y) * (rightCorner.x - tile.position.x);
            if (Math.abs(head.y - leftCorner.y) >= 0.05) {
                if (headComparedToLeft > 0) {
                    this.position.x = tile.position.x - tile.size.x / 2 - this.size.x / 2;
                } else if (headComparedToRight < 0) {
                    this.position.x = tile.position.x + tile.size.x / 2 + this.size.x / 2;
                } else {
                    this.stopJumping();
                    this.position.y = tile.position.y - tile.size.y / 2 - this.size.y / 2;
                }
            } else {
                this.stopJumping();
                this.position.y = tile.position.y - tile.size.y / 2 - this.size.y / 2;
            }

            // console.log("left, " + headComparedToLeft + ", right " + headComparedToRight);
        }
    }

    walk(running, forwBackValue) {
        let newWalkingSpeed = this.walkingSpeed;
        let newWalkingCount = this.walkingCount;

        if (newWalkingCount < this.walkingMax) {
            newWalkingCount++;
            newWalkingSpeed += this.walkingAcceleration * newWalkingCount;
        }

        let finalWalkingSpeed = forwBackValue * (newWalkingSpeed * (running ? 2 : 1));

        let newPosition = new THREE.Vector2(this.position.x + finalWalkingSpeed, this.position.y);
        if (!this.isWithinColliderX(colliders, newPosition, this.size)) {
            this.walkingSpeed = newWalkingSpeed;
            this.walkingCount = newWalkingCount;
            this.position.x = newPosition.x;
        }
    }

    stopWalking() {
        this.walkingSpeed = 0;
        this.walkingCount = 0;
    }

    die() {
        new Sound("res/sounds/ldjamdead.mp3").play();
        this.stopFalling();
        this.stopWalking();
        this.position.set(this.spawn.x, this.spawn.y);
        incrementDeathCounter();
        return true;
    }

    isWithinColliderY(colliders, position, size) {
        let x1 = Math.round(position.x + 0.01 - size.x / 2);
        let x2 = Math.round(position.x - 0.01 + size.x / 2);
        let y1 = position.y + size.y / 2;
        let y2 = position.y - size.y / 2;

        let rows = [];
        let additionalTiles = x1 !== x2;

        let from = Math.round(y1) - 1;
        let to = Math.round(y2) + 1;

        if (from < 0) {
            from = 0;
        }
        if (to > colliders.length) {
            to = colliders.length;
        }

        for (let i = from; i < to; i++) {

            let elem0 = colliders[x1][i];
            if (elem0 != null) {
                rows.push(elem0);
            }
            if (additionalTiles) {
                let elem1 = colliders[x2][i];
                if (elem1 != null) {
                    rows.push(elem1);
                }
            }
        }

        let result = false;

        if (rows != null) {
            rows.forEach((tile) => {
                let y1Tile = tile.position.y + tile.size.y / 2;
                let y2Tile = tile.position.y - tile.size.y / 2;

                if (y1 > y2Tile && y2 < y1Tile) {
                    result = true;
                    this.underCollider = tile;
                    return result;
                }
            });
        }

        return result;
    }

    isWithinColliderX(colliders, position, size) {
        let y1 = Math.round(position.y + size.y / 2);
        let y2 = Math.round(position.y - size.y / 2);
        let x1 = position.x - size.x / 2;
        let x2 = position.x + size.x / 2;
        if (x2 < 0 || x1 > colliders.length)
            return;

        let tiles = [];
        let additionalTiles = y1 !== y2;


        let from = Math.round(x1) - 1;
        let to = Math.round(x2) + 1;

        if (from < 0) {
            from = 0;
        }
        if (to > colliders.length) {
            to = colliders.length;
        }

        for (let i = from; i < to; i++) {

            let elem0 = colliders[i][y1];
            if (elem0 != null) {
                tiles.push(elem0);
            }
            if (additionalTiles) {
                let elem1 = colliders[i][y2];
                if (elem1 != null) {
                    tiles.push(elem1);
                }
            }
        }

        let result = false;

        if (tiles != null) {
            tiles.forEach((tile) => {
                let x1Tile = tile.position.x - tile.size.x / 2;
                let x2Tile = tile.position.x + tile.size.x / 2;

                if (x1 < x2Tile && x2 > x1Tile) {
                    result = true;
                    this.sideCollider = tile;
                    return result;
                }
            });
        }

        return result;
    }

    updateSprite() {
        this.sprite.position.set(this.position.x, this.position.y, 0);

        // if(this.walking < 0){
        //     this.sprite.scale.x = -1;
        // } else {
        //     this.sprite.scale.x = 1;
        // }

        if (this.verticalMovement.value < 0) {
            //Set fall animation
            if (this.walkingSpeed > 0) {
                //Set move animation and direction right
                this.animation.setIndexAnim(4, 16);
            } else if (this.walkingSpeed < 0) {
                //Set move animation and direction left TODO
                this.animation.setIndexAnim(4, 16);
            } else {
                //Regular falling animation
                this.animation.setIndexAnim(3, 16);
            }
        } else if (this.verticalMovement.value > 0) {
            //Set jump animation
            this.animation.setIndexAnim(2, 16);
        } else if (this.walkingSpeed > 0) {
            //Set move animation and direction right
            this.animation.setIndexAnim(1, 16);
        } else if (this.walkingSpeed < 0) {
            //Set move animation and direction left TODO
            this.animation.setIndexAnim(1, 16);
        } else {
            //Idle animation
            this.animation.setIndexAnim(0, 4);
        }
    }
}

class Tile {
    constructor(url, position, interaction, size = new THREE.Vector2(1, 1)) {
        let spriteMap = new THREE.TextureLoader().load(url);
        spriteMap.magFilter = THREE.NearestFilter;
        let spriteMaterial = new THREE.SpriteMaterial({map: spriteMap});
        let sprite = new THREE.Sprite(spriteMaterial);

        this.interaction = interaction;
        this.sprite = sprite;
        this.size = size;
        this.sprite.scale.set(size.x, size.y);
        this.position = position;
        this.sprite.position.set(position.x, position.y, 0);
    }

}