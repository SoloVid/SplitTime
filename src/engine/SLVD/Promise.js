dependsOn("SLVD.js");

//Promises for SplitTime
SLVD.Promise = function() {
	this.callBacks = [];
	this.babyPromises = [];
};
SLVD.Promise.prototype.then = function(callBack) {
	if(!(callBack instanceof Function)) {
		console.warn("callBack is not a function");
		return;
	}

	if(this.isResolved()) {
		return callBack(this.data);
	}
	else {
		this.callBacks.push(callBack);

		var baby = new SLVD.Promise();
		this.babyPromises.push(baby);
		return baby;
	}
};
SLVD.Promise.prototype.resolve = function(data) {
	if(this.resolved) {
		console.warn("Promise already resolved");
		return;
	}

	this.resolved = true;
	this.data = data;

	while(this.callBacks.length > 0) {
		var callBack = this.callBacks.shift();
		var babyPromise = this.babyPromises.shift();

		var result = callBack(data);

		if((result instanceof SLVD.Promise)) { //callback returned promise
			var tPromise = result;
			if(tPromise.isResolved()) { //callback returned resolved promise
				babyPromise.resolve(tPromise.data);
			}
			else { //callback returned unresolved promise
				while(babyPromise.callBacks.length > 0) {
					tPromise.callBacks.push(babyPromise.callBacks.shift());
					tPromise.babyPromises.push(babyPromise.babyPromises.shift());
				}
			}
		}
		else { //callback returned other data (or no data)
			babyPromise.resolve(result);
		}
	}
};
SLVD.Promise.prototype.isResolved = function() {
	return this.resolved;
};

SLVD.Promise.as = function(data) {
	var prom = new SLVD.Promise();
	prom.resolve(data);
	return prom;
};
SLVD.Promise.when = function(arr) {
    if(arguments.length == 1 && Array.isArray(arr)) {
        return SLVD.Promise.when.apply(this, arr);
    }
    var prom = new SLVD.Promise();
    var promiseCount = arguments.length;
    var results = [];

    function addResult(index, data) {
        results[index] = data;
    }

    function checkResolve() {
        for(var iResult = 0; iResult < promiseCount; iResult++) {
            if(!(iResult in results)) {
                return false;
            }
        }
        prom.resolve(results);
        return true;
    }

    function makeSingleResolveHandler(index) {
        return function(data) {
            addResult(index, data);
            checkResolve();
        };
    }

    for(var iPromise = 0; iPromise < arguments.length; iPromise++) {
        arguments[iPromise].then(makeSingleResolveHandler(iPromise));
    }
    return prom;
};
SLVD.Promise.whenAny = function(arr) {
    if(arguments.length == 1 && Array.isArray(arr)) {
        return SLVD.Promise.whenAny.apply(this, arr);
    }

    var prom = new SLVD.Promise();
    var isResolved = false;

    for(var iPromise = 0; iPromise < arguments.length; iPromise++) {
        arguments[iPromise].then(function(data) {
            if(!isResolved) {
                isResolved = true;
                prom.resolve(data);
            }
        });
    }

    return prom;
};

SLVD.Promise.Collection = function() {
	this.promises = [];
};
SLVD.Promise.Collection.prototype.add = function(prom) {
	this.promises.push(prom);
};
SLVD.Promise.Collection.prototype.then = function(callBack) {
	return SLVD.Promise.when(this.promises).then(callBack);
};
