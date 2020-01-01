namespace SLVD{
    
    export class RegisterCallbacks {
        _handlers: any[];
        _isRunningCallbacks: boolean;
        _listAwaitingRegistration: any[];
        _listAwaitingRemoval: any[];
        _allowedObjectMethods: any;
        constructor(allowedObjectMethods?: string[]) {
            this._handlers = [];
            this._isRunningCallbacks = false;
            this._listAwaitingRegistration = [];
            this._listAwaitingRemoval = [];
            this._allowedObjectMethods = allowedObjectMethods || [];
        };
        
        clear() {
            this._handlers = [];
        };
        
        waitForOnce() {
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
        registerCallback(callback) {
            this.register(callback);
        };
        
        register(handler) {
            if(this._isRunningCallbacks) {
                this._listAwaitingRegistration.push(handler);
            } else {
                this._handlers.push(handler);
            }
        };
        
        /**
        * @deprecated use {@link SLVD.RegisterCallbacks#remove} instead
        */
        removeCallback(callback) {
            this.remove(callback);
        };
        
        remove(handler) {
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
        runCallbacks(data?) {
            this.run(data);
        };
        
        run(data?) {
            this._isRunningCallbacks = true;
            for(var i = this._handlers.length - 1; i >= 0; i--) {
                // Default to true so exceptions don't continue
                var done = true;
                try {
                    done = this._callFunction(this._handlers[i], data);
                } catch(ex) {
                    console.error(ex);
                    console.warn("callback will be removed");
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
        
        length() {
            return this._handlers.length;
        };
        
        _callFunction(registered, data) {
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
    }
}