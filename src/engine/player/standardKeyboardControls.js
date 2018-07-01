dependsOn("Keyboard.js");
dependsOn("Controls.js");

(function() {
    var Button = SplitTime.Controls.Button;
    var Keyboard = SplitTime.Keyboard;

    Button.GUI_CONFIRMATION = Button.createKeyboardBinding(Keyboard.SPACE, Keyboard.ENTER);
    Button.PRIMARY_INTERACT = Button.createKeyboardBinding(Keyboard.SPACE, Keyboard.ENTER);

    // TODO: replace with implementation utilizing x and y calculations
    SplitTime.Controls.JoyStick.getDirection = function() {
        var dKeys = 0;
        var dir = 0;
        if(Keyboard.isKeyDown(Keyboard.A) || Keyboard.isKeyDown(Keyboard.LEFT)) //West
        {
            //How many directional keys down
            dKeys++;
            //Average in the new direction to the current direction
            dir = ((dir*(dKeys - 1)) + 2)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.W) || Keyboard.isKeyDown(Keyboard.UP)) //North
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + 1)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.D) || Keyboard.isKeyDown(Keyboard.RIGHT)) //East
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + 0)/dKeys;
        }
        if(Keyboard.isKeyDown(Keyboard.S) || Keyboard.isKeyDown(Keyboard.DOWN)) //South
        {
            dKeys++;
            dir = ((dir*(dKeys - 1)) + 3)/dKeys;
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
