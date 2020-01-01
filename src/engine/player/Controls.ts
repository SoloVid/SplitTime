namespace SplitTime.controls {
    export const JoyStick = {
        getDirection: function() {
            return null;
        },
        onTilt: function(callback) {}
    };
    
    export class Button {
        _bindings: { obsolete: boolean; };
        _downCallbacks: SLVD.RegisterCallbacks;
        _upCallbacks: SLVD.RegisterCallbacks;
        onDown: any;
        onUp: any;
        isDown: any;
        constructor(onDown, onUp, isDown) {
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
        
        setKeyboardBindings(/* keyCodes...*/) {
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
                SplitTime.keyboard.onDown(keyCodes[i], runDownCallbacks);
                SplitTime.keyboard.afterUp(keyCodes[i], runUpCallbacks);
            }
            
            this.isDown = function() {
                for(var i = 0; i < keyCodes.length; i++) {
                    if(SplitTime.keyboard.isKeyDown(keyCodes[i])) {
                        return true;
                    }
                }
                return false;
            };
        };
        
        waitForDown() {
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
        
        waitForAfterUp() {
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
    }
}