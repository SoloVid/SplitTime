dependsOn("SLVD.js");

/**
 * @param {string[]} [allowedObjectMethods]
 * @class
 */
SLVD.RegisterCallbacks = function(allowedObjectMethods) {
    this._handlers = [];
    this._isRunningCallbacks = false;
    this._listAwaitingRegistration = [];
    this._listAwaitingRemoval = [];
    this._allowedObjectMethods = allowedObjectMethods || [];
};

SLVD.RegisterCallbacks.prototype.clear = function() {
    this._handlers = [];
};

SLVD.RegisterCallbacks.prototype.waitForOnce = function() {
    var promise = new SLVD.Promise();

    this.register(function(data) {
        promise.resolve(data);
        return true;
    });

    return promise;
};

/**
 * @deprecated use {@link SLVD.RegisterCallbacks#register} instead
 */
SLVD.RegisterCallbacks.prototype.registerCallback = function(callback) {
    this.register(callback);
};

SLVD.RegisterCallbacks.prototype.register = function(handler) {
    if(this._isRunningCallbacks) {
        this._listAwaitingRegistration.push(handler);
    } else {
        this._handlers.push(handler);
    }
};

/**
 * @deprecated use {@link SLVD.RegisterCallbacks#remove} instead
 */
SLVD.RegisterCallbacks.prototype.removeCallback = function(callback) {
    this.remove(callback);
};

SLVD.RegisterCallbacks.prototype.remove = function(handler) {
    if(this._isRunningCallbacks) {
        this._listAwaitingRemoval.push(handler);
    } else {
        for(var i = this._handlers.length - 1; i >= 0; i--) {
            if(handler === this._handlers[i]) {
                this._handlers.splice(i, 1);
            }
        }
    }
};

/**
 * @deprecated use {@link SLVD.RegisterCallbacks#run} instead
 */
SLVD.RegisterCallbacks.prototype.runCallbacks = function(data) {
    this.run(data);
};

SLVD.RegisterCallbacks.prototype.run = function(data) {
    this._isRunningCallbacks = true;
    for(var i = this._handlers.length - 1; i >= 0; i--) {
        // Default to true so exceptions don't continue
        // var done = true;
        var done = false;
        try {
            done = this._callFunction(this._handlers[i], data);
        } catch(ex) {
            console.error(ex);
            // console.warn("callback will be removed");
        }
        if(done) {
            this._handlers.splice(i, 1);
        }
    }
    this._isRunningCallbacks = false;

    while(this._listAwaitingRegistration.length > 0) {
        this.register(this._listAwaitingRegistration.shift());
    }
    while(this._listAwaitingRemoval.length > 0) {
        this.remove(this._listAwaitingRemoval.shift());
    }
};

SLVD.RegisterCallbacks.prototype.length = function() {
    return this._handlers.length;
};

SLVD.RegisterCallbacks.prototype._callFunction = function(registered, data) {
    if(typeof registered === "function") {
        return registered(data);
    }

    for(var i = 0; i < this._allowedObjectMethods.length; i++) {
        var allowedMethod = this._allowedObjectMethods[i];
        if(typeof registered[allowedMethod] === "function") {
            return registered[allowedMethod](data);
        }
    }

    console.warn("Invalid registered callback", registered);
};