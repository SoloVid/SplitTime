SplitTime.Keyboard = {};

SplitTime.Keyboard.A = 65; // 'a'
SplitTime.Keyboard.S = 83; // 's'
SplitTime.Keyboard.D = 68; // 'd'
SplitTime.Keyboard.W = 87; // 'w'
SplitTime.Keyboard.SPACE = 32; // 'space'
SplitTime.Keyboard.ENTER = 13; // 'enter'
SplitTime.Keyboard.LEFT = 37; // 'left'
SplitTime.Keyboard.DOWN = 40; // 'down'
SplitTime.Keyboard.RIGHT = 39; // 'right'
SplitTime.Keyboard.UP = 38; // 'up'
SplitTime.Keyboard.J = 74; // 'j'
SplitTime.Keyboard.K = 75; // 'k'
SplitTime.Keyboard.L = 76; // 'l'
SplitTime.Keyboard.I = 73; // 'i'

(function() {
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
        getDownCallbacks(keyCode).registerCallback(callback);
    };

    SplitTime.Keyboard.waitForUp = function(keyCode) {
        return getUpCallbacks(keyCode).waitForOnce();
    };
    SplitTime.Keyboard.afterUp = function(keyCode, callback) {
        getUpCallbacks(keyCode).registerCallback(callback);
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
            alert(SplitTime.player[SplitTime.currentPlayer].x + ", " + SplitTime.player[SplitTime.currentPlayer].y + ", " + SplitTime.player[SplitTime.currentPlayer].z);
        }

        keyDown[keyCode] = true;

        getDownCallbacks(keyCode).runCallbacks();
    };

    //The clean-up of the above function.
    SplitTime.Keyboard.onKeyUp = function(e) {
        var keyCode = e.which || e.keyCode;
        keyDown[keyCode] = false;

        getUpCallbacks(keyCode).runCallbacks();
    }
} ());