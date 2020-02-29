namespace SLVD {
    export const STOP_CALLBACKS = "SC"
    export type CallbackResult = void | "SC"
    type CallbackFunction = (data?: any) => CallbackResult
    type CallbackObject =
        | { [method: string]: (data?: any) => CallbackResult }
        | any
    type Callback = CallbackFunction | CallbackObject

    export enum CopingMechanism {
        RETHROW,
        SUPPRESS,
        LOG
    }

    export class RegisterCallbacks {
        private _handlers: Callback[] = []
        private _isRunningCallbacks: boolean = false
        private _listAwaitingRegistration: Callback[] = []
        private _listAwaitingRemoval: Callback[] = []
        private _allowedObjectMethods: any[] = []
        constructor(allowedObjectMethodsPattern?: object) {
            if (allowedObjectMethodsPattern) {
                for (var methodName in allowedObjectMethodsPattern) {
                    this._allowedObjectMethods.push(methodName)
                }
            }
        }

        clear() {
            this._handlers = []
        }

        waitForOnce() {
            var promise = new SLVD.Promise()

            this.register(function(data: any) {
                promise.resolve(data)
                return true
            })

            return promise
        }

        /**
         * @deprecated use {@link SLVD.RegisterCallbacks#register} instead
         */
        registerCallback(callback: Callback) {
            this.register(callback)
        }

        register(handler: Callback) {
            if (this._isRunningCallbacks) {
                this._listAwaitingRegistration.push(handler)
            } else {
                this._handlers.push(handler)
            }
        }

        /**
         * @deprecated use {@link SLVD.RegisterCallbacks#remove} instead
         */
        removeCallback(callback: Callback) {
            this.remove(callback)
        }

        remove(handler: Callback) {
            if (this._isRunningCallbacks) {
                this._listAwaitingRemoval.push(handler)
            } else {
                for (var i = this._handlers.length - 1; i >= 0; i--) {
                    if (handler === this._handlers[i]) {
                        this._handlers.splice(i, 1)
                    }
                }
            }
        }

        /**
         * @deprecated use {@link SLVD.RegisterCallbacks#run} instead
         */
        runCallbacks(data?: any) {
            this.run(data)
        }

        run(
            data?: any,
            exceptionCoping: CopingMechanism = CopingMechanism.RETHROW
        ) {
            this._isRunningCallbacks = true
            for (var i = this._handlers.length - 1; i >= 0; i--) {
                // Default to true so exceptions don't continue
                // var done = true;
                var done = false
                try {
                    const result = this._callFunction(this._handlers[i], data)
                    if (result === STOP_CALLBACKS) {
                        done = true
                    }
                } catch (ex) {
                    switch (exceptionCoping) {
                        case CopingMechanism.RETHROW:
                            throw ex
                        case CopingMechanism.LOG:
                            splitTime.Logger.error(ex)
                            break
                        case CopingMechanism.SUPPRESS:
                            break
                    }
                    // console.warn("callback will be removed");
                }
                if (done) {
                    this._handlers.splice(i, 1)
                }
            }
            this._isRunningCallbacks = false

            while (this._listAwaitingRegistration.length > 0) {
                this.register(this._listAwaitingRegistration.shift())
            }
            while (this._listAwaitingRemoval.length > 0) {
                this.remove(this._listAwaitingRemoval.shift())
            }
        }

        length() {
            return this._handlers.length
        }

        private _callFunction(registered: Callback, data: any) {
            if (typeof registered === "function") {
                return registered(data)
            }

            for (var i = 0; i < this._allowedObjectMethods.length; i++) {
                var allowedMethod = this._allowedObjectMethods[i]
                if (typeof registered[allowedMethod] === "function") {
                    return registered[allowedMethod](data)
                }
            }

            console.warn("Invalid registered callback", registered)
        }
    }
}
