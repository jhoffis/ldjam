"use strict";

document.addEventListener('keydown', function (event) {

    if (event.keyCode == 87) {
        //W
        keys.W.pressed = true;
    }
    if (event.keyCode == 65 ) {
        //A
        keys.A.pressed = true;
    }
    if (event.keyCode == 68) {
        //D
        keys.D.pressed = true;
    }
    if (event.keyCode == 16) {
        //shift
        keys.SHIFT.pressed = true;
    }

});

document.addEventListener('keyup', function (event) {

    if (event.keyCode == 87) {
        //W
        keys.W.pressed = false;
        keys.W.released = true;
    }
    if (event.keyCode == 65 ) {
        //A
        keys.A.pressed = false;
        keys.A.released = true;
    }
    if (event.keyCode == 68) {
        //D
        keys.D.pressed = false;
        keys.D.released = true;
    }
    if (event.keyCode == 16) {
        //shift
        keys.SHIFT.pressed = false;
        keys.SHIFT.released = true;
    }
});