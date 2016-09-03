//Generic "step" for projectiles

dependsOn("Action.js");

SplitTime.Action["propelProjectile"] = function(acceleration) {
	if(acceleration !== undefined)
	{
		this.accel = acceleration;
	}
};
SplitTime.Action["propelProjectile"].prototype = new baseAction();
SplitTime.Action["propelProjectile"].prototype.constructor = SplitTime.Action["propelProjectile"];

SplitTime.Action["propelProjectile"].prototype.accel = 0;

SplitTime.Action["propelProjectile"].prototype.use = function(dart) {
	this.time = 1;
};
SplitTime.Action["propelProjectile"].prototype.update = function(dart) {
	//Move projectile
	var moved = dart.zeldaStep(dart.spd);
	for(var index = 0; index < SplitTime.boardAgent.length; index++)
	{
		var potOpp = SplitTime.boardAgent[index];
		if(!dart.getTeam().isAllied(potOpp.getTeam()))
		{
			if(SplitTime.distanceTrue(dart.x, dart.y, potOpp.x, potOpp.y) <= dart.baseLength + potOpp.baseLength + 2)
			{
				potOpp.damage(dart.atk); //damage hit opponent
				this.time = 0;
				dart.hp = 0;
				potOpp.giveStatus(new SplitTime.Status["hurt"](1)); //"hurt" opponent
				index = SplitTime.boardAgent.length; //break out of loop
			}
		}
	}
	//If hit terrain
	if(moved == -1)
	{
		this.time = 0;
		dart.hp = 0;
	}

	dart.requestStance("default");

	if(SplitTime.frameClock == 1)
	{
		dart.spd -= this.accel;
		if(dart.spd <= 0)
		{
			dart.hp = 0;
		}
	}

	if(dart.omniDir)
	{
		dart.rotate = -(Math.PI/2)*dart.dir;
	}
};
