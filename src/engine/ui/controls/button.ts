import { RegisterCallbacks, CallbackResult, int, STOP_CALLBACKS } from "../../splitTime";
import { Keyboard } from "./keyboard";
export class Button {
    _bindings: {
        obsolete: boolean;
    };
    _downCallbacks: RegisterCallbacks;
    _upCallbacks: RegisterCallbacks;
    _onDown: (callback: () => CallbackResult) => void;
    _onUp: (callback: () => CallbackResult) => void;
    _isDown: () => boolean;
    constructor(private readonly keyboard: Keyboard, onDown?: (callback: () => void) => void, onUp?: (callback: () => void) => void, isDown?: () => boolean) {
        this._bindings = {
            obsolete: true
        };
        this._downCallbacks = new RegisterCallbacks();
        this._upCallbacks = new RegisterCallbacks();
        var that = this;
        this._onDown =
            onDown ||
                function (callback: () => CallbackResult) {
                    that._downCallbacks.register(callback);
                };
        this._onUp =
            onUp ||
                function (callback: () => CallbackResult) {
                    that._upCallbacks.register(callback);
                };
        this._isDown =
            isDown ||
                function () {
                    return false;
                };
    }
    onDown(callback: () => CallbackResult) {
        return this._onDown(callback);
    }
    onUp(callback: () => CallbackResult) {
        return this._onUp(callback);
    }
    isDown() {
        return this._isDown();
    }
    setKeyboardBindings(...keyCodes: int[]) {
        this._bindings.obsolete = true;
        this._bindings = {
            obsolete: false
        };
        var currentBindings = this._bindings;
        var that = this;
        function runDownCallbacks() {
            if (currentBindings.obsolete) {
                return STOP_CALLBACKS;
            }
            that._downCallbacks.run();
            return;
        }
        function runUpCallbacks() {
            if (currentBindings.obsolete) {
                return STOP_CALLBACKS;
            }
            that._upCallbacks.run();
            return;
        }
        for (var i = 0; i < keyCodes.length; i++) {
            this.keyboard.onDown(keyCodes[i], runDownCallbacks);
            this.keyboard.afterUp(keyCodes[i], runUpCallbacks);
        }
        this.isDown = function () {
            for (var i = 0; i < keyCodes.length; i++) {
                if (this.keyboard.isKeyDown(keyCodes[i])) {
                    return true;
                }
            }
            return false;
        };
    }
    waitForDown() {
        var isResolved = false;
        const promise = new Promise<void>(resolve => {
            this.onDown(function () {
                // Since the button could be overloaded, we might be dealing with multiple registered callbacks
                if (!isResolved) {
                    isResolved = true;
                    resolve();
                }
                return STOP_CALLBACKS;
            });
        });
        return promise;
    }
    waitForAfterUp(): Promise<void> {
        var isResolved = false;
        const promise = new Promise<void>(resolve => {
            this.onUp(function () {
                // Since the button could be overloaded, we might be dealing with multiple registered callbacks
                if (!isResolved) {
                    isResolved = true;
                    resolve();
                }
                return STOP_CALLBACKS;
            });
        });
        return promise;
    }
}
