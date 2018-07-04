dependsOn("Keyboard.js");
dependsOn("Controls.js");

(function() {
    var Button = SplitTime.Controls.Button;
    var Keyboard = SplitTime.Keyboard;

    Button.GUI_CONFIRMATION = Button.createKeyboardBinding(Keyboard.SPACE, Keyboard.ENTER);
    Button.PRIMARY_INTERACT = Button.createKeyboardBinding(Keyboard.SPACE, Keyboard.ENTER);

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

    // TODO: replace with implementation utilizing x and y calculations
    SplitTime.Controls.JoyStick.getDirection = function() {
        var dKeys = 0;
        var dir = 0;
        if(Keyboard.isKeyDown(Keyboard.A) || Keyboard.isKeyDown(Keyboard.LEFT)) //West
        {
            //How many directional keys down
            dKeys++;
            //Average in the new direction to the current direction
            dir = ((dir*(dKeys - 1)) + SplitTime.Direction.W)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.W) || Keyboard.isKeyDown(Keyboard.UP)) //North
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + SplitTime.Direction.N)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.D) || Keyboard.isKeyDown(Keyboard.RIGHT)) //East
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + SplitTime.Direction.E)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.S) || Keyboard.isKeyDown(Keyboard.DOWN)) //South
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + SplitTime.Direction.S)/dKeys;
        }
        if((Keyboard.isKeyDown(Keyboard.S) || Keyboard.isKeyDown(Keyboard.DOWN)) && (Keyboard.isKeyDown(Keyboard.D) || Keyboard.isKeyDown(Keyboard.RIGHT))) //Southeast
        {
            dir += 2;
        }

        if(dKeys > 0) {
            return dir % 4;
        }
        return null;
    };
} ());
