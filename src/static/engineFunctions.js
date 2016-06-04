SLVDE.setupMainPromise = function() {
	SLVDE.mainPromise = new SLVD.promise();
	return SLVDE.mainPromise;
};

SLVDE.delay = function(seconds) {
	SLVDE.process = "delay";
	SLVDE.countdown = Math.round(seconds*SLVDE.FPS);

	SLVDE.mainPromise = new SLVD.promise();
	return SLVDE.mainPromise;
};

SLVDE.waitForKeyPress = function() {
	SLVDE.mainPromise = new SLVD.promise();

	SLVDE.countdown = 0;
	SLVDE.process = "wait";

	return SLVDE.mainPromise;
};

SLVDE.waitForEnterOrSpace = function() {
	SLVDE.mainPromise = new SLVD.promise();

	SLVDE.countdown = 0;
	SLVDE.process = "waitForEnterOrSpace";

	return SLVDE.mainPromise;
};
