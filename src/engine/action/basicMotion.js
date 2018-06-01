//Motions are actions with 0 priority: they only happen when nothing else does.
SplitTime.Motion = {};

dependsOn("Action.js");

SplitTime.baseMotion = function() { };
SplitTime.baseMotion.prototype = new baseAction();
SplitTime.baseMotion.prototype.constructor = SplitTime.baseMotion;
SplitTime.baseMotion.prototype.canUse = function() {
	if(this.wait > 0)
	{
		this.wait--;
		return false;
	}
	return true;
};
SplitTime.baseMotion.prototype.type = "motion";
SplitTime.baseMotion.prototype.prob = 0;
SplitTime.baseMotion.prototype.steps = 0;
SplitTime.baseMotion.prototype.wait = 0;

SplitTime.baseMotion.prototype.regularMotion = function(person, newSteps, newDir) {
	if(this.steps > 0)
	{
		person.requestStance("walk");
		person.zeldaStep(person.spd);
		this.steps--;
		if(this.steps <= 0)
		{
			this.wait = SLVD.randomInt(4) + 28;
		}
	}
	else if(this.wait > 0)
	{
		this.wait--;

		person.defaultStance();
	}
	else if(this.steps <= 0)
	{
		person.dir = newDir;
		this.steps = newSteps;
	}
};

SplitTime.Motion["random"] = function() {};
SplitTime.Motion["random"].prototype = new SplitTime.baseMotion();
SplitTime.Motion["random"].prototype.constructor = SplitTime.Motion["random"];
SplitTime.Motion["random"].prototype.use = function(person) {
	this.regularMotion(person, SLVD.randomInt(16) + 16, SLVD.randomInt(4) - 1);
};
SplitTime.Motion["line"] = function() {};
SplitTime.Motion["line"].prototype = new SplitTime.baseMotion();
SplitTime.Motion["line"].prototype.constructor = SplitTime.Motion["line"];
SplitTime.Motion["line"].prototype.use = function(person) {
	this.regularMotion(person, 64, Math.round((boardNPC[index].dir + 2)%4));
};

SplitTime.Motion["square"] = function() {};
SplitTime.Motion["square"].prototype = new SplitTime.baseMotion();
SplitTime.Motion["square"].prototype.constructor = SplitTime.Motion["square"];
SplitTime.Motion["square"].prototype.use = function(person) {
	this.regularMotion(person, 64, Math.round((boardNPC[index].dir + 1)%4));
};

SplitTime.Motion["chase"] = function() {};
SplitTime.Motion["chase"].prototype = new SplitTime.baseMotion();
SplitTime.Motion["chase"].prototype.constructor = SplitTime.Motion["chase"];
SplitTime.Motion["chase"].prototype.canUse = function(person) {
	var dist = Math.sqrt(Math.pow(person.x - SplitTime.player[SplitTime.currentPlayer].x, 2) + Math.pow(person.y - SplitTime.player[SplitTime.currentPlayer].y, 2));
	return (dist < 256 && person.z == SplitTime.player[SplitTime.currentPlayer].z && person.canSeePlayer());
};
SplitTime.Motion["chase"].prototype.use = function(person) {
	person.zeldaLockOnPlayer();
	person.requestStance("run");
	person.zeldaStep(person.spd);
};
