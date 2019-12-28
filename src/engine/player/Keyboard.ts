SplitTime.Keyboard = {};

SplitTime.Keyboard.A = 65;
SplitTime.Keyboard.S = 83;
SplitTime.Keyboard.D = 68;
SplitTime.Keyboard.W = 87;

SplitTime.Keyboard.LEFT = 37;
SplitTime.Keyboard.DOWN = 40;
SplitTime.Keyboard.RIGHT = 39;
SplitTime.Keyboard.UP = 38;

SplitTime.Keyboard.J = 74;
SplitTime.Keyboard.K = 75;
SplitTime.Keyboard.L = 76;
SplitTime.Keyboard.I = 73;

SplitTime.Keyboard.SPACE = 32;
SplitTime.Keyboard.ENTER = 13;

SplitTime.Keyboard.Q = 81;
SplitTime.Keyboard.E = 69;

SplitTime.Keyboard.Z = 90;
SplitTime.Keyboard.X = 88;
SplitTime.Keyboard.C = 67;

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

SplitTime.Keyboard.isKeyDown = function(keyCode) {
    return !!keyDown[keyCode];
};

SplitTime.Keyboard.waitForDown = function(keyCode) {
    return getDownCallbacks(keyCode).waitForOnce();
};
SplitTime.Keyboard.onDown = function(keyCode, callback) {
    getDownCallbacks(keyCode).register(callback);
};

SplitTime.Keyboard.waitForUp = function(keyCode) {
    return getUpCallbacks(keyCode).waitForOnce();
};
SplitTime.Keyboard.afterUp = function(keyCode, callback) {
    getUpCallbacks(keyCode).register(callback);
};

//Sets variables useful for determining what keys are down at any time.
SplitTime.Keyboard.onKeyDown = function(e) {
    var keyCode = e.which || e.keyCode;

    //Prevent scrolling with arrows
    if([
            SplitTime.Keyboard.SPACE,
            SplitTime.Keyboard.DOWN,
            SplitTime.Keyboard.UP,
            SplitTime.Keyboard.LEFT,
            SplitTime.Keyboard.RIGHT
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
SplitTime.Keyboard.onKeyUp = function(e) {
    var keyCode = e.which || e.keyCode;
    keyDown[keyCode] = false;

    getUpCallbacks(keyCode).run();
};
