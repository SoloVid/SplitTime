SplitTime.Controls = {};

SplitTime.Controls.JoyStick = {
    getDirection: function() {
        return null;
    },
    onTilt: function(callback) {}
};

(function() {
    SplitTime.Controls.Button = {
        GUI_CONFIRMATION: new ControllerButton(),
        PRIMARY_INTERACT: new ControllerButton()
    };

    SplitTime.Controls.Button.createKeyboardBinding = function(/* keyCodes...*/) {
        var keyCodes = [];
        for(var i = 0; i < arguments.length; i++) {
            keyCodes.push(arguments[i]);
        }
        return new ControllerButton(function(callback) {
            for(var i = 0; i < keyCodes.length; i++) {
                SplitTime.Keyboard.onDown(keyCodes[i], callback);
            }
        }, function(callback) {
            for(var i = 0; i < keyCodes.length; i++) {
                SplitTime.Keyboard.afterUp(keyCodes[i], callback);
            }
        }, function() {
            for(var i = 0; i < keyCodes.length; i++) {
                if(SplitTime.Keyboard.isKeyDown(keyCodes[i])) {
                    return true;
                }
            }
            return false;
        });
    };

    function ControllerButton(onDown, onUp, isDown) {
        this.onDown = onDown || function() {};
        this.onUp = onUp || function() {};
        this.isDown = isDown || function() { return false; };
    }

    ControllerButton.prototype.waitForDown = function() {
        var promise = new SLVD.Promise();
        var isResolved = false;

        this.onDown(function() {
            // Since the button could be overloaded, we might be dealing with multiple registered callbacks
            if(!isResolved) {
                isResolved = true;
                promise.resolve();
            }
            return true;
        });

        return promise;
    };

    ControllerButton.prototype.waitForAfterUp = function() {
        var promise = new SLVD.Promise();
        var isResolved = false;

        this.onUp(function() {
            // Since the button could be overloaded, we might be dealing with multiple registered callbacks
            if(!isResolved) {
                isResolved = true;
                promise.resolve();
            }
            return true;
        });

        return promise;
    };
} ());