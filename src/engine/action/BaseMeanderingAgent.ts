dependsOn("Agent.js");

SplitTime.Agent.BaseMeandering = function(body) {
	this.body = body;
};
SplitTime.Agent.BaseMeandering.prototype.pixels = 0;
SplitTime.Agent.BaseMeandering.prototype.wait = 0;
SplitTime.Agent.BaseMeandering.prototype.counter = null;

SplitTime.Agent.BaseMeandering.prototype.regularMotion = function(person, newSteps, newDir) {
	if(this.pixels > 0) {
		person.requestStance("walk");
		var pixelsThisFrame = person.getPixelSpeedForFrame();
		var mover = new SplitTime.Body.Mover(person);
		mover.zeldaStep(person.dir, pixelsThisFrame);
		this.pixels -= pixelsThisFrame;
		if(this.pixels <= 0) {
			this.counter = person.getLevel().getRegion().getTimeStabilizer(1000 + SLVD.randomInt(1000));
		}
	} else if(this.counter !== null) {
		// Prevent walking animation
        person.defaultStance();

		if(this.counter.isSignaling()) {
			this.counter = null;
		}
	} else if(this.pixels <= 0) {
		person.dir = newDir;
		this.pixels = newSteps;
	}
};

SplitTime.Agent.RandomMeandering = function(body) {
	this.body = body;
	this.base = new SplitTime.Agent.BaseMeandering(body);
};
SplitTime.Agent.RandomMeandering.prototype.notifyFrameUpdate = function() {
	this.base.regularMotion(this.body, SLVD.randomInt(16) + 16, SplitTime.Direction.getRandom());
};

SplitTime.Agent.LineMeandering = function(body) {
    this.body = body;
    this.base = new SplitTime.Agent.BaseMeandering(body);
};
SplitTime.Agent.LineMeandering.prototype.notifyFrameUpdate = function() {
	this.base.regularMotion(this.body, 64, Math.round((this.body.dir + 2)%4));
};

SplitTime.Agent.SquareMeandering = function(body) {
    this.body = body;
    this.base = new SplitTime.Agent.BaseMeandering(body);
};
SplitTime.Agent.SquareMeandering.prototype.notifyFrameUpdate = function() {
	this.base.regularMotion(this.body, 64, Math.round((this.body.dir + 1)%4));
};
