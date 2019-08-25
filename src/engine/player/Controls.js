dependsOn("/SLVD/RegisterCallbacks.js");

SplitTime.Controls = {};

SplitTime.Controls.JoyStick = {
    getDirection: function() {
        return null;
    },
    onTilt: function(callback) {}
};

SplitTime.Controls.Button = function(onDown, onUp, isDown) {
    this._bindings = {
        obsolete: true
    };

    this._downCallbacks = new SLVD.RegisterCallbacks();
    this._upCallbacks = new SLVD.RegisterCallbacks();

    var that = this;
    this.onDown = onDown || function(callback) {
        that._downCallbacks.register(callback);
    };
    this.onUp = onUp || function(callback) {
        that._upCallbacks.register(callback);
    };
    this.isDown = isDown || function() { return false; };
};

SplitTime.Controls.Button.prototype.setKeyboardBindings = function(/* keyCodes...*/) {
    var keyCodes = [];
    for(var iArg = 0; iArg < arguments.length; iArg++) {
        keyCodes.push(arguments[iArg]);
    }

    this._bindings.obsolete = true;
    this._bindings = {
        obsolete: false
    };
    var currentBindings = this._bindings;
    var that = this;

    function runDownCallbacks() {
        if(currentBindings.obsolete) {
            return true;
        }
        that._downCallbacks.run();
    }

    function runUpCallbacks() {
        if(currentBindings.obsolete) {
            return true;
        }
        that._upCallbacks.run();
    }

    for(var i = 0; i < keyCodes.length; i++) {
        SplitTime.Keyboard.onDown(keyCodes[i], runDownCallbacks);
        SplitTime.Keyboard.afterUp(keyCodes[i], runUpCallbacks);
    }

    this.isDown = function() {
        for(var i = 0; i < keyCodes.length; i++) {
            if(SplitTime.Keyboard.isKeyDown(keyCodes[i])) {
                return true;
            }
        }
        return false;
    };
};

SplitTime.Controls.Button.prototype.waitForDown = function() {
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

SplitTime.Controls.Button.prototype.waitForAfterUp = function() {
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
