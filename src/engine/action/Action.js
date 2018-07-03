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

function BaseAction() { }
BaseAction.prototype.time = 0;
BaseAction.prototype.prob = 1;
BaseAction.prototype.type = "attack";
BaseAction.prototype.getProbability = function() { return this.prob; };
BaseAction.prototype.canUse = function(person) { return true; };
BaseAction.prototype.forceEnd = function(person) { return; };
BaseAction.prototype.shouldUse = function(person) { return true; };
BaseAction.prototype.use = function(person) { };
BaseAction.prototype.update = function(person) { this.time--; };
BaseAction.prototype.see = function(person) { };

SplitTime.Action.Slash = function(prob) {
	if(prob !== undefined)
	{
		this.prob = prob;
	}
};
SplitTime.Action.Slash.prototype = new BaseAction();
SplitTime.Action.Slash.prototype.constructor = SplitTime.Action.Slash;
SplitTime.Action.Slash.prototype.time = 4;
SplitTime.Action.Slash.prototype.canUse = function(person) {
	return SplitTime.distanceTrue(person.x, person.y, SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y) < 36 && person.canSeePlayer();
};
SplitTime.Action.Slash.prototype.use = function(person) {
	this.time = 4;
	var agents = person.getLevel().getAgents();
	for(var third = 0; third < agents.length; third++)
	{
		if(agents[third].team != person.team)
		{
			//One tile away
			var caseTRPG = Math.pow(SplitTime.xPixToTile(agents[third].x) - SplitTime.xPixToTile(person.x), 2) + Math.pow(SplitTime.yPixToTile(agents[third].y) - SplitTime.yPixToTile(person.y), 2) == 1;
			//Distance < 40
			var caseZelda = Math.sqrt(Math.pow(agents[third].x - person.x, 2) + Math.pow(agents[third].y - person.y, 2)) < 40;

			if((SplitTime.process == "TRPG" && caseTRPG) || (SplitTime.process == "action" && caseZelda))
			{
				//Determine angle between slasher and opponent (in terms of PI/2)
				var angle = SplitTime.Direction.fromTo(person.x, person.y, agents[third].x, agents[third].y);

				//Compare angle to direction of slasher. If in range of PI... and if not already hurt and not invincible
				if((Math.abs(angle - person.dir) < 1 || Math.abs(angle - person.dir) > 3) && agents[third].status != "hurt" && agents[third].status != "invincible")
				{
					agents[third].zeldaBump(16, angle);
					agents[third].damage(5);
					agents[third].giveStatus(new SplitTime.Status.Hurt(1));
				}
			}
		}
	}
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
