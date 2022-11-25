import { int } from "globals";
import { error, warn } from "./logger";
import { Pledge } from "./pledge";
export const STOP_CALLBACKS = Symbol("SC");
export type STOP_CALLBACKS_TYPE = typeof STOP_CALLBACKS;
export type CallbackResult = void | STOP_CALLBACKS_TYPE;
type CallbackFunction = (data?: unknown) => CallbackResult;
type CallbackObject = {
    [method: string]: CallbackFunction;
} | object;
export type Callback = CallbackFunction | CallbackObject;
export enum CopingMechanism {
    RETHROW,
    SUPPRESS,
    LOG
}
export class RegisterCallbacks {
    static STOP_CALLBACKS: STOP_CALLBACKS_TYPE = STOP_CALLBACKS

    private _handlers: Callback[] = [];
    private _isRunningCallbacks: boolean = false;
    private _listAwaitingRegistration: Callback[] = [];
    private _listAwaitingRemoval: Callback[] = [];
    private _allowedObjectMethods: string[] = [];
    constructor(allowedObjectMethodsPattern?: object) {
        if (allowedObjectMethodsPattern) {
            for (var methodName in allowedObjectMethodsPattern) {
                this._allowedObjectMethods.push(methodName);
            }
        }
    }
    clear() {
        this._handlers = [];
    }
    waitForOnce() {
        var promise = new Pledge();
        this.register(function (data: unknown) {
            promise.resolve(data);
            return true;
        });
        return promise;
    }
    register(handler: Callback) {
        if (this._isRunningCallbacks) {
            this._listAwaitingRegistration.push(handler);
        }
        else {
            this._handlers.push(handler);
        }
    }
    remove(handler: Callback) {
        if (this._isRunningCallbacks) {
            this._listAwaitingRemoval.push(handler);
        }
        else {
            for (var i = this._handlers.length - 1; i >= 0; i--) {
                if (handler === this._handlers[i]) {
                    this._handlers.splice(i, 1);
                }
            }
        }
    }
    run(data?: unknown, exceptionCoping: CopingMechanism = CopingMechanism.RETHROW) {
        try {
            this._isRunningCallbacks = true;
            for (const handler of this._handlers) {
                let done = false;
                try {
                    const result = this._callFunction(handler, data);
                    if (result === STOP_CALLBACKS) {
                        done = true;
                    }
                }
                catch (ex) {
                    switch (exceptionCoping) {
                        case CopingMechanism.RETHROW:
                            throw ex;
                        case CopingMechanism.LOG:
                            error(ex);
                            break;
                        case CopingMechanism.SUPPRESS:
                            break;
                    }
                }
                if (done) {
                    this._listAwaitingRemoval.push(handler);
                }
            }
        }
        finally {
            this._isRunningCallbacks = false;
        }
        while (this._listAwaitingRegistration.length > 0) {
            this.register(this._listAwaitingRegistration.shift()!);
        }
        while (this._listAwaitingRemoval.length > 0) {
            this.remove(this._listAwaitingRemoval.shift()!);
        }
    }
    get length(): int {
        return this._handlers.length;
    }
    private _callFunction(registered: Callback, data: unknown) {
        if (typeof registered === "function") {
            return registered(data);
        }
        for (var i = 0; i < this._allowedObjectMethods.length; i++) {
            var allowedMethod = this._allowedObjectMethods[i];
            const obj = registered as {
                [funcName: string]: (param?: unknown) => CallbackResult;
            };
            if (typeof obj[allowedMethod] === "function") {
                return obj[allowedMethod](data);
            }
        }
        warn("Invalid registered callback", registered);
    }
}
