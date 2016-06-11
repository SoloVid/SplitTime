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

function baseAction() { }
baseAction.prototype.time = 0;
baseAction.prototype.prob = 1;
baseAction.prototype.type = "attack";
baseAction.prototype.getProbability = function() { return this.prob; };
baseAction.prototype.canUse = function(person) { return true; };
baseAction.prototype.forceEnd = function(person) { return; };
baseAction.prototype.shouldUse = function(person) { return true; };
baseAction.prototype.use = function(person) { };
baseAction.prototype.update = function(person) { this.time--; };
baseAction.prototype.see = function(person) { };

SplitTime.Action["slash"] = function(prob) {
	if(prob !== undefined)
	{
		this.prob = prob;
	}
};
SplitTime.Action["slash"].prototype = new baseAction();
SplitTime.Action["slash"].prototype.constructor = SplitTime.Action["slash"];
SplitTime.Action["slash"].prototype.time = 4;
SplitTime.Action["slash"].prototype.canUse = function(person) {
	return SplitTime.distanceTrue(person.x, person.y, SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y) < 36 && person.canSeePlayer();
};
SplitTime.Action["slash"].prototype.use = function(person) {
	this.time = 4;
	for(var third = 0; third < SplitTime.boardAgent.length; third++)
	{
		if(SplitTime.boardAgent[third].team != person.team)
		{
			//One tile away
			var caseTRPG = Math.pow(SplitTime.xPixToTile(SplitTime.boardAgent[third].x) - SplitTime.xPixToTile(person.x), 2) + Math.pow(SplitTime.yPixToTile(SplitTime.boardAgent[third].y) - SplitTime.yPixToTile(person.y), 2) == 1;
			//Distance < 40
			var caseZelda = Math.sqrt(Math.pow(SplitTime.boardAgent[third].x - person.x, 2) + Math.pow(SplitTime.boardAgent[third].y - person.y, 2)) < 40;

			if((SplitTime.process == "TRPG" && caseTRPG) || (SplitTime.process == "zelda" && caseZelda))
			{
				//Determine angle between slasher and opponent (in terms of PI/2)
				var angle = SplitTime.dirFromTo(person.x, person.y, SplitTime.boardAgent[third].x, SplitTime.boardAgent[third].y);

				//Compare angle to direction of slasher. If in range of PI... and if not already hurt and not invincible
				if((Math.abs(angle - person.dir) < 1 || Math.abs(angle - person.dir) > 3) && SplitTime.boardAgent[third].status != "hurt" && SplitTime.boardAgent[third].status != "invincible")
				{
					SplitTime.boardAgent[third].zeldaBump(16, angle);
					SplitTime.boardAgent[third].damage(5);
					SplitTime.boardAgent[third].giveStatus(new SplitTime.Status["hurt"](1));
				}
			}
		}
	}
};
SplitTime.Action["slash"].prototype.update = function(person) {
	if(this.time <= 0)
	{
		//person.rcvr = 16 - person.spd;
	}
	this.time--;
};
SplitTime.Action["slash"].prototype.see = function(person) {
	//Blur SplitTime.player
	SplitTime.snapShotCtx.globalAlpha = 0.10;
	var tSqueeze = 4;
	var col = person.getStance();
	for(var third = -12; third < 12; third++)
	{
		SplitTime.snapShotCtx.drawImage(person.getImage(), person.xres*col, person.yres*person.frame, person.xres, person.yres, third*Math.cos(Math.PI/2*(4 - Math.round(person.dir))) - person.xres/2 - person.baseOffX, tSqueeze + third*Math.sin(Math.PI/2*(4 - Math.round(person.dir))) - person.yres + person.baseLength/2 - person.baseOffY, person.xres, person.yres - tSqueeze);
	}
	SplitTime.snapShotCtx.globalAlpha = 1;

	//Draw arc
	SplitTime.snapShotCtx.lineWidth = 8;
	SplitTime.snapShotCtx.beginPath();
	SplitTime.snapShotCtx.arc(0, 0, 32, 0.5*((3 - person.dir) - 0.5 + (this.time/2))*Math.PI, 0.5*((3 - person.dir) + 0.5 + (this.time/2))*Math.PI);
	SplitTime.snapShotCtx.strokeStyle = "white";
	SplitTime.snapShotCtx.stroke();
};
