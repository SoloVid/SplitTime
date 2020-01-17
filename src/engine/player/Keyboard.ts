namespace SplitTime.keyboard {

export const A = 65;
export const S = 83;
export const D = 68;
export const W = 87;

export const LEFT = 37;
export const DOWN = 40;
export const RIGHT = 39;
export const UP = 38;

export const J = 74;
export const K = 75;
export const L = 76;
export const I = 73;

export const SPACE = 32;
export const ENTER = 13;

export const Q = 81;
export const E = 69;

export const Z = 90;
export const X = 88;
export const C = 67;

var keyDown: { [keyCode: number]: boolean } = {};

var downCallbacks: { [keyCode: number]: SLVD.RegisterCallbacks } = {};
function getDownCallbacks(keyCode: number) {
    if(!downCallbacks[keyCode]) {
        downCallbacks[keyCode] = new SLVD.RegisterCallbacks();
    }
    return downCallbacks[keyCode];
}
var upCallbacks: { [keyCode: number]: SLVD.RegisterCallbacks } = {};
function getUpCallbacks(keyCode: number) {
    if(!upCallbacks[keyCode]) {
        upCallbacks[keyCode] = new SLVD.RegisterCallbacks();
    }
    return upCallbacks[keyCode];
}

export function isKeyDown(keyCode: number) {
    return !!keyDown[keyCode];
};

export function waitForDown(keyCode: number) {
    return getDownCallbacks(keyCode).waitForOnce();
};
export function onDown(keyCode: number, callback: () => SLVD.CallbackResult) {
    getDownCallbacks(keyCode).register(callback);
};

export function waitForUp(keyCode: number) {
    return getUpCallbacks(keyCode).waitForOnce();
};
export function afterUp(keyCode: number, callback: () => SLVD.CallbackResult) {
    getUpCallbacks(keyCode).register(callback);
};

//Sets variables useful for determining what keys are down at any time.
export function onKeyDown(e: KeyboardEvent) {
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
export function onKeyUp(e: KeyboardEvent) {
    var keyCode = e.which || e.keyCode;
    keyDown[keyCode] = false;

    getUpCallbacks(keyCode).run();
};
}