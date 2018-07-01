dependsOn("SLVD.js");

SLVD.RegisterCallbacks = function() {
    this.callbacks = [];
};

SLVD.RegisterCallbacks.prototype.clearCallbacks = function() {
    this.callbacks = [];
};

SLVD.RegisterCallbacks.prototype.waitForOnce = function() {
    var promise = new SLVD.Promise();

    this.registerCallback(function(data) {
        promise.resolve(data);
        return true;
    });

    return promise;
};

SLVD.RegisterCallbacks.prototype.registerCallback = function(callback) {
    this.callbacks.unshift(callback);
};

SLVD.RegisterCallbacks.prototype.runCallbacks = function(data) {
    for(var i = this.callbacks.length - 1; i >= 0; i--) {
        var done = true;
        try {
            done = this.callbacks[i](data);
        } catch(ex) {
            console.error(ex);
        }
        if(done) {
            this.callbacks.splice(i, 1);
        }
    }
};
