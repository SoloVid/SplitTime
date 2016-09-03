//Projectile launch action

dependsOn("Action.js");

SplitTime.Action["launchProjectile"] = function(projectile, recoveryTime, probability) {
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
SplitTime.Action["launchProjectile"].prototype = new baseAction();
SplitTime.Action["launchProjectile"].prototype.constructor = SplitTime.Action["launchProjectile"];
SplitTime.Action["launchProjectile"].prototype.type = "throw";

SplitTime.Action["launchProjectile"].prototype.rcvr = 0;

SplitTime.Action["launchProjectile"].prototype.use = function(person) {
	var launchedProjectile = new this.dart();

	launchedProjectile.setX(person.x);
	launchedProjectile.setY(person.y);
	launchedProjectile.setLayer(person.layer);
	launchedProjectile.dir = person.dir;
	launchedProjectile.team = person.team;

	SplitTime.insertBoardC(launchedProjectile);

	this.time = this.rcvr + SLVD.randomInt(16) - 8;
};
