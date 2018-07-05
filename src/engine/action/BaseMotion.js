//Motions are actions with 0 priority: they only happen when nothing else does.
SplitTime.Motion = {};

dependsOn("Action.js");

SplitTime.BaseMotion = function() { };
SplitTime.BaseMotion.prototype = new BaseAction();
SplitTime.BaseMotion.prototype.constructor = SplitTime.BaseMotion;
SplitTime.BaseMotion.prototype.canUse = function() {
	if(this.wait > 0)
	{
		this.wait--;
		return false;
	}
	return true;
};
SplitTime.BaseMotion.prototype.type = "motion";
SplitTime.BaseMotion.prototype.prob = 0;
SplitTime.BaseMotion.prototype.steps = 0;
SplitTime.BaseMotion.prototype.wait = 0;

SplitTime.BaseMotion.prototype.regularMotion = function(person, newSteps, newDir) {
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

SplitTime.Motion.Random = function() {};
SplitTime.Motion.Random.prototype = new SplitTime.BaseMotion();
SplitTime.Motion.Random.prototype.constructor = SplitTime.Motion.Random;
SplitTime.Motion.Random.prototype.use = function(person) {
	this.regularMotion(person, SLVD.randomInt(16) + 16, SLVD.randomInt(4) - 1);
};
SplitTime.Motion.Line = function() {};
SplitTime.Motion.Line.prototype = new SplitTime.BaseMotion();
SplitTime.Motion.Line.prototype.constructor = SplitTime.Motion.Line;
SplitTime.Motion.Line.prototype.use = function(person) {
	this.regularMotion(person, 64, Math.round((boardNPC[index].dir + 2)%4));
};

SplitTime.Motion.Square = function() {};
SplitTime.Motion.Square.prototype = new SplitTime.BaseMotion();
SplitTime.Motion.Square.prototype.constructor = SplitTime.Motion.Square;
SplitTime.Motion.Square.prototype.use = function(person) {
	this.regularMotion(person, 64, Math.round((boardNPC[index].dir + 1)%4));
};

SplitTime.Motion.Chase = function() {};
SplitTime.Motion.Chase.prototype = new SplitTime.BaseMotion();
SplitTime.Motion.Chase.prototype.constructor = SplitTime.Motion.Chase;
SplitTime.Motion.Chase.prototype.canUse = function(person) {
	var player = SplitTime.Player.getActiveBody();
	var dist = SplitTime.Measurement.distanceTrue(person.x, person.y, player.x, player.y);
	return (dist < 256 && person.z == player.z && person.canSeeBody(player));
};
SplitTime.Motion.Chase.prototype.use = function(person) {
	person.zeldaLockOnPlayer();
	person.requestStance("run");
	person.zeldaStep(person.spd);
};
