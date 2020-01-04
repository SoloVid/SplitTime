namespace SLVD {
	//Promises for SplitTime
	export class Promise {
		callBacks: Function[];
		babyPromises: Promise[];
		resolved: boolean;
		data: any;
		constructor() {
			this.callBacks = [];
			this.babyPromises = [];
		}
		then(callBack: Function) {
			if(!(callBack instanceof Function)) {
				console.warn("callBack is not a function");
				return;
			}
			
			if(this.isResolved()) {
				var result = callBack(this.data);
				if(result instanceof SLVD.Promise) {
					return result;
				} else {
					return SLVD.Promise.as(result);
				}
			}
			else {
				this.callBacks.push(callBack);
				
				var baby = new SLVD.Promise();
				this.babyPromises.push(baby);
				return baby;
			}
		}
		
		resolve(data?) {
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
				
				if(result instanceof SLVD.Promise) { //callback returned promise
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
		isResolved() {
			return this.resolved;
		};
		
		static as(data?) {
			var prom = new SLVD.Promise();
			prom.resolve(data);
			return prom;
		};
		static when(arr) {
			if(!Array.isArray(arr)) {
				var newArr = new Array(arguments.length);
				for(var i = 0; i < arguments.length; i++) {
					newArr[i] = arguments[i];
				}
				return SLVD.Promise.when(newArr);
			}
			
			var prom = new SLVD.Promise();
			var results = [];
			
			function addResult(index, data) {
				results[index] = data;
			}
			
			function checkResolve() {
				for(var iResult = 0; iResult < arr.length; iResult++) {
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
			
			for(var iPromise = 0; iPromise < arr.length; iPromise++) {
				arr[iPromise].then(makeSingleResolveHandler(iPromise));
			}
			return prom;
		};
		static whenAny(arr) {
			if(!Array.isArray(arr)) {
				var newArr = new Array(arguments.length);
				for(var i = 0; i < arguments.length; i++) {
					newArr[i] = arguments[i];
				}
				return SLVD.Promise.whenAny(newArr);
			}
			
			var prom = new SLVD.Promise();
			var isResolved = false;
			
			function callback(data) {
				if(!isResolved) {
					isResolved = true;
					prom.resolve(data);
				}
			}
			
			for(var iPromise = 0; iPromise < arr.length; iPromise++) {
				arr[iPromise].then(callback);
			}
			
			return prom;
		};
	}
	export class PromiseCollection {
		promises: SLVD.Promise[];
		constructor() {
			this.promises = [];
		};
		add(prom) {
			this.promises.push(prom);
		};
		then(callBack) {
			return SLVD.Promise.when(this.promises).then(callBack);
		};
		
		static wait(ms) {
			var promise = new SLVD.Promise();
			setTimeout(function() {
				promise.resolve();
			}, ms);
			return promise;
		};
	}
}