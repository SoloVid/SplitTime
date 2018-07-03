//Projectile launch action

dependsOn("Action.js");

SplitTime.Action.LaunchProjectile = function(projectile, recoveryTime, probability) {
	this.dart = projectile;
	if(probability !== undefined)
	{
		this.prob = probability;
	}
	if(recoveryTime !== undefined)
	{
		this.rcvr = recoveryTime;
	}
};
SplitTime.Action.LaunchProjectile.prototype = new BaseAction();
SplitTime.Action.LaunchProjectile.prototype.constructor = SplitTime.Action.LaunchProjectile;
SplitTime.Action.LaunchProjectile.prototype.type = "throw";

SplitTime.Action.LaunchProjectile.prototype.rcvr = 0;

SplitTime.Action.LaunchProjectile.prototype.use = function(person) {
	var launchedProjectile = new this.dart();

	launchedProjectile.setX(person.x);
	launchedProjectile.setY(person.y);
	launchedProjectile.setZ(person.z);
	launchedProjectile.dir = person.dir;
	launchedProjectile.team = person.team;

	person.getLevel().insertBody(launchedProjectile);

	this.time = this.rcvr + SLVD.randomInt(16) - 8;
};
