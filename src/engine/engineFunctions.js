SplitTime.setupMainPromise = function() {
	SplitTime.mainPromise = new SLVD.Promise();
	return SplitTime.mainPromise;
};

SplitTime.delay = function(seconds) {
	SplitTime.process = "delay";
	SplitTime.countdown = Math.round(seconds*SplitTime.FPS);

	SplitTime.mainPromise = new SLVD.Promise();
	return SplitTime.mainPromise;
};

SplitTime.waitForKeyPress = function() {
	SplitTime.mainPromise = new SLVD.Promise();

	SplitTime.countdown = 0;
	SplitTime.process = "wait";

	return SplitTime.mainPromise;
};

SplitTime.waitForEnterOrSpace = function() {
	SplitTime.mainPromise = new SLVD.Promise();

	SplitTime.countdown = 0;
	SplitTime.process = "waitForEnterOrSpace";

	return SplitTime.mainPromise;
};
