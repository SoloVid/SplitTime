dependsOn("SLVD.js");

//Promises for SplitTime
SLVD.Promise = function() {};
SLVD.Promise.prototype.then = function(callBack) {
	if("data" in this) {
		return callBack(this.data);
	}
	else {
		this.callBack = callBack;

		this.babyPromise = new SLVD.Promise();

		return this.babyPromise;
	}
};
SLVD.Promise.prototype.resolve = function(data) {
	if(this.callBack) {
		var tPromise = this.callBack(data);

		if(this.babyPromise) {
			if(!(tPromise instanceof SLVD.Promise)) {
				this.babyPromise.resolve(tPromise);
			}
			else if("data" in tPromise) {
				this.babyPromise.resolve(tPromise.data);
			}
			else {
				tPromise.callBack = this.babyPromise.callBack;
				if(this.babyPromise.babyPromise) {
					tPromise.babyPromise = this.babyPromise.babyPromise;
				}
			}
		}
	}
	else {
		this.data = data;
	}
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

SLVD.Promise.collection = function() {
	this.promises = [];
};
SLVD.Promise.collection.prototype.add = function(prom) {
	this.promises.push(prom);
};
SLVD.Promise.collection.prototype.then = function(callBack) {
	return SLVD.Promise.when(this.promises).then(callBack);
};
