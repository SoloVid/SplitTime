/*The action system is designed to abstract actions into their components apart from the engine.
Each action is associated with five different functions:
	canUse: returns true/false depending on circumstances, indicates if action should be used by SplitTime.NPC like an AI
	use: no significant return value, carries out the initial action; should include a form of "canUse" to prevent illegal SplitTime.player action
	update: no significant return value, carries out the ongoing code each frame action is used
	SplitTime.see: no significant return value, renders graphics each frame onto the screen just after calling SplitTime.player/SplitTime.NPC is drawn
See "slash" action below for usage sampling
One of the most important usage guidelines is the use of time.
	The engine will continue to call the action's update function for a particular person until this.time hits 0.
	Keep in mind that this.time will likely be 0 at the call of use();
	so this.time should generally be initialized in use() and decremented in update().
If there is to be a delay before the person may use another SplitTime.Action of the same class, don't let this.time reach zero
	and let the last bit of the count do nothing in this.update()
If there is to be a delay before the person may use this same SplitTime.Action, set some property of the SplitTime.Action
	(e.g. this.rcvr) to a significant number which canUse may reference
*/

SplitTime.Action = {};

// console.log("loaded SplitTime.Action");

SplitTime.Action.BaseAction = function() { };
SplitTime.Action.BaseAction.prototype.time = 0;
SplitTime.Action.BaseAction.prototype.prob = 1;
SplitTime.Action.BaseAction.prototype.type = "attack";
SplitTime.Action.BaseAction.prototype.getProbability = function() { return this.prob; };
SplitTime.Action.BaseAction.prototype.canUse = function(person) { return true; };
SplitTime.Action.BaseAction.prototype.forceEnd = function(person) { return; };
SplitTime.Action.BaseAction.prototype.shouldUse = function(person) { return true; };
SplitTime.Action.BaseAction.prototype.use = function(person) { };
SplitTime.Action.BaseAction.prototype.update = function(person) { this.time--; };
SplitTime.Action.BaseAction.prototype.see = function(person) { };

SplitTime.Action.Slash = function(prob) {
	if(prob !== undefined)
	{
		this.prob = prob;
	}
};
SplitTime.Action.Slash.prototype = new SplitTime.Action.BaseAction();
SplitTime.Action.Slash.prototype.constructor = SplitTime.Action.Slash;
SplitTime.Action.Slash.prototype.time = 4;
SplitTime.Action.Slash.prototype.canUse = function(person) {
	return SplitTime.Measurement.distanceTrue(person.x, person.y, SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y) < 36 && person.canSeePlayer();
};
SplitTime.Action.Slash.prototype.use = function(person) {
	this.time = 4;
	// var agents = person.getLevel().getAgents();
    // for(var third = 0; third < agents.length; third++)
    // {
	person.getLevel().forEachAgent(function(agent) {
		if(agent.team != person.team)
		{
			//One tile away
			var caseTRPG = Math.pow(SplitTime.xPixToTile(agent.x) - SplitTime.xPixToTile(person.x), 2) + Math.pow(SplitTime.yPixToTile(agent.y) - SplitTime.yPixToTile(person.y), 2) == 1;
			//Distance < 40
			var caseZelda = Math.sqrt(Math.pow(agent.x - person.x, 2) + Math.pow(agent.y - person.y, 2)) < 40;

			if((SplitTime.process == "TRPG" && caseTRPG) || (SplitTime.process === SplitTime.main.State.ACTION && caseZelda))
			{
				//Determine angle between slasher and opponent (in terms of PI/2)
				var angle = SplitTime.Direction.fromTo(person.x, person.y, agent.x, agent.y);

				//Compare angle to direction of slasher. If in range of PI... and if not already hurt and not invincible
				if((Math.abs(angle - person.dir) < 1 || Math.abs(angle - person.dir) > 3) && agent.status != "hurt" && agent.status != "invincible")
				{
					agent.zeldaBump(16, angle);
					agent.damage(5);
					agent.giveStatus(new SplitTime.Status.Hurt(1));
				}
			}
		}
	});
};
SplitTime.Action.Slash.prototype.update = function(person) {
	if(this.time <= 0)
	{
		//person.rcvr = 16 - person.spd;
	}
	this.time--;
};
SplitTime.Action.Slash.prototype.see = function(person) {
	//Blur SplitTime.player
	SplitTime.snapShotCtx.globalAlpha = 0.10;
	var tSqueeze = 4;
	// var col = person.getStance();
	for(var third = -12; third < 12; third++)
	{
		SplitTime.snapShotCtx.drawImage(person.getImage(), person.sx, person.sy, person.xres, person.yres, third*Math.cos(Math.PI/2*(4 - Math.round(person.dir))) - person.xres/2 - person.baseOffX, tSqueeze + third*Math.sin(Math.PI/2*(4 - Math.round(person.dir))) - person.yres + person.baseLength/2 - person.baseOffY, person.xres, person.yres - tSqueeze);
	}
	SplitTime.snapShotCtx.globalAlpha = 1;

	//Draw arc
	SplitTime.snapShotCtx.lineWidth = 8;
	SplitTime.snapShotCtx.beginPath();
	SplitTime.snapShotCtx.arc(0, 0, 32, 0.5*((3 - person.dir) - 0.5 + (this.time/2))*Math.PI, 0.5*((3 - person.dir) + 0.5 + (this.time/2))*Math.PI);
	SplitTime.snapShotCtx.strokeStyle = "white";
	SplitTime.snapShotCtx.stroke();
};
