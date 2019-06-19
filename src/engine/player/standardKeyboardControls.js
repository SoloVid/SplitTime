dependsOn("Keyboard.js");
dependsOn("Controls.js");

var Button = SplitTime.Controls.Button;
var Keyboard = SplitTime.Keyboard;

Button.GUI_CONFIRMATION.setKeyboardBindings(Keyboard.SPACE, Keyboard.ENTER);
Button.PRIMARY_INTERACT.setKeyboardBindings(Keyboard.SPACE, Keyboard.ENTER);
Button.PRIMARY_ACTION.setKeyboardBindings(Keyboard.X);

var DIRECTIONAL_KEYS = [
    Keyboard.A,
    Keyboard.S,
    Keyboard.D,
    Keyboard.W,
    Keyboard.DOWN,
    Keyboard.UP,
    Keyboard.LEFT,
    Keyboard.RIGHT
];
var MIN_TIME_BETWEEN_STROKES = 30;
SplitTime.Controls.JoyStick.onTilt = function(callback) {
    var lastTrigger = new Date();
    var isDone = false;

    var innerCallback = function() {
        if(isDone) {
            return true;
        }

        var newTime = new Date();
        if(newTime - lastTrigger < MIN_TIME_BETWEEN_STROKES) {
            return false;
        }
        lastTrigger = newTime;

        isDone = callback();
        return isDone;
    };

    for(var i = 0; i < DIRECTIONAL_KEYS.length; i++) {
        Keyboard.onDown(DIRECTIONAL_KEYS[i], innerCallback);
    }
};

SplitTime.Controls.JoyStick.getDirection = function() {
    var x = 0;
    var y = 0;
    if(Keyboard.isKeyDown(Keyboard.A) || Keyboard.isKeyDown(Keyboard.LEFT)) //West
    {
        x--;
    }
    if(Keyboard.isKeyDown(Keyboard.W) || Keyboard.isKeyDown(Keyboard.UP)) //North
    {
        y--;
    }
    if(Keyboard.isKeyDown(Keyboard.D) || Keyboard.isKeyDown(Keyboard.RIGHT)) //East
    {
        x++;
    }
    if(Keyboard.isKeyDown(Keyboard.S) || Keyboard.isKeyDown(Keyboard.DOWN)) //South
    {
        y++;
    }

    if(x !== 0 || y !== 0) {
        return SplitTime.Direction.fromTo(0, 0, x, y);
    }
    return null;
};
