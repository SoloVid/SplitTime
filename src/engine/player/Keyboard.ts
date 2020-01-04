namespace SplitTime.keyboard {

export var A = 65;
export var S = 83;
export var D = 68;
export var W = 87;

export var LEFT = 37;
export var DOWN = 40;
export var RIGHT = 39;
export var UP = 38;

export var J = 74;
export var K = 75;
export var L = 76;
export var I = 73;

export var SPACE = 32;
export var ENTER = 13;

export var Q = 81;
export var E = 69;

export var Z = 90;
export var X = 88;
export var C = 67;

var keyDown = {};

var downCallbacks = {};
function getDownCallbacks(keyCode) {
    if(!downCallbacks[keyCode]) {
        downCallbacks[keyCode] = new SLVD.RegisterCallbacks();
    }
    return downCallbacks[keyCode];
}
var upCallbacks = {};
function getUpCallbacks(keyCode) {
    if(!upCallbacks[keyCode]) {
        upCallbacks[keyCode] = new SLVD.RegisterCallbacks();
    }
    return upCallbacks[keyCode];
}

export function isKeyDown(keyCode) {
    return !!keyDown[keyCode];
};

export function waitForDown(keyCode) {
    return getDownCallbacks(keyCode).waitForOnce();
};
export function onDown(keyCode, callback) {
    getDownCallbacks(keyCode).register(callback);
};

export function waitForUp(keyCode) {
    return getUpCallbacks(keyCode).waitForOnce();
};
export function afterUp(keyCode, callback) {
    getUpCallbacks(keyCode).register(callback);
};

//Sets variables useful for determining what keys are down at any time.
export function onKeyDown(e) {
    var keyCode = e.which || e.keyCode;

    //Prevent scrolling with arrows
    if([
            SplitTime.keyboard.SPACE,
            SplitTime.keyboard.DOWN,
            SplitTime.keyboard.UP,
            SplitTime.keyboard.LEFT,
            SplitTime.keyboard.RIGHT
        ].indexOf(keyCode) > -1) {
        e.preventDefault();
    }

    var key = e.key.toLowerCase();

    if(key == "t") {
        // Note: This case is just here for quick and dirty testing
        alert("Huzzah!");
    }

    keyDown[keyCode] = true;

    getDownCallbacks(keyCode).run();
};

//The clean-up of the above function.
export function onKeyUp(e) {
    var keyCode = e.which || e.keyCode;
    keyDown[keyCode] = false;

    getUpCallbacks(keyCode).run();
};
}