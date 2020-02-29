namespace SplitTime.controls {
    export class Button {
        _bindings: { obsolete: boolean }
        _downCallbacks: SLVD.RegisterCallbacks
        _upCallbacks: SLVD.RegisterCallbacks
        _onDown: (callback: () => SLVD.CallbackResult) => void
        _onUp: (callback: () => SLVD.CallbackResult) => void
        _isDown: () => boolean
        constructor(
            onDown?: (callback: () => void) => void,
            onUp?: (callback: () => void) => void,
            isDown?: () => boolean
        ) {
            this._bindings = {
                obsolete: true
            }

            this._downCallbacks = new SLVD.RegisterCallbacks()
            this._upCallbacks = new SLVD.RegisterCallbacks()

            var that = this
            this._onDown =
                onDown ||
                function(callback: () => SLVD.CallbackResult) {
                    that._downCallbacks.register(callback)
                }
            this._onUp =
                onUp ||
                function(callback: () => SLVD.CallbackResult) {
                    that._upCallbacks.register(callback)
                }
            this._isDown =
                isDown ||
                function() {
                    return false
                }
        }

        onDown(callback: () => SLVD.CallbackResult) {
            return this._onDown(callback)
        }

        onUp(callback: () => SLVD.CallbackResult) {
            return this._onUp(callback)
        }

        isDown() {
            return this._isDown()
        }

        setKeyboardBindings(...keyCodes: int[]) {
            this._bindings.obsolete = true
            this._bindings = {
                obsolete: false
            }
            var currentBindings = this._bindings
            var that = this

            function runDownCallbacks() {
                if (currentBindings.obsolete) {
                    return SLVD.STOP_CALLBACKS
                }
                that._downCallbacks.run()
                return
            }

            function runUpCallbacks() {
                if (currentBindings.obsolete) {
                    return SLVD.STOP_CALLBACKS
                }
                that._upCallbacks.run()
                return
            }

            for (var i = 0; i < keyCodes.length; i++) {
                KEYBOARD_INSTANCE.onDown(keyCodes[i], runDownCallbacks)
                KEYBOARD_INSTANCE.afterUp(keyCodes[i], runUpCallbacks)
            }

            this.isDown = function() {
                for (var i = 0; i < keyCodes.length; i++) {
                    if (KEYBOARD_INSTANCE.isKeyDown(keyCodes[i])) {
                        return true
                    }
                }
                return false
            }
        }

        waitForDown() {
            var isResolved = false

            const promise = new Promise<void>(resolve => {
                this.onDown(function() {
                    // Since the button could be overloaded, we might be dealing with multiple registered callbacks
                    if (!isResolved) {
                        isResolved = true
                        resolve()
                    }
                    return SLVD.STOP_CALLBACKS
                })
            })

            return promise
        }

        waitForAfterUp(): Promise<void> {
            var isResolved = false

            const promise = new Promise<void>(resolve => {
                this.onUp(function() {
                    // Since the button could be overloaded, we might be dealing with multiple registered callbacks
                    if (!isResolved) {
                        isResolved = true
                        resolve()
                    }
                    return SLVD.STOP_CALLBACKS
                })
            })

            return promise
        }
    }
}
