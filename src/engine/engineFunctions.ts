SplitTime.setupMainPromise = function() {
	SplitTime.mainPromise = new SLVD.Promise();
	return SplitTime.mainPromise;
};

SplitTime.delay = function(seconds) {
	var formerProcess = SplitTime.process;
	SplitTime.process = SplitTime.main.State.OTHER;
	return SLVD.Promise.wait(seconds * 1000).then(function() {
		SplitTime.process = formerProcess;
	});
	// SplitTime.countdown = Math.round(seconds*SplitTime.FPS);
    //
	// SplitTime.mainPromise = new SLVD.Promise();
	// return SplitTime.mainPromise;
};

SplitTime.waitForEnterOrSpace = function() {
	SplitTime.mainPromise = new SLVD.Promise();

	SplitTime.countdown = 0;
	SplitTime.process = "waitForEnterOrSpace";

	return SplitTime.mainPromise;
};
