/*The action system is designed to abstract actions into their components apart from the engine.
Each action is associated with five different functions:
	canUse: returns true/false depending on circumstances, indicates if action should be used by SLVDE.NPC like an AI
	use: no significant return value, carries out the initial action; should include a form of "canUse" to prevent illegal SLVDE.player action
	update: no significant return value, carries out the ongoing code each frame action is used
	SLVDE.see: no significant return value, renders graphics each frame onto the screen just after calling SLVDE.player/SLVDE.NPC is drawn
See "slash" action below for usage sampling
One of the most important usage guidelines is the use of time.
	The engine will continue to call the action's update function for a particular person until this.time hits 0.
	Keep in mind that this.time will likely be 0 at the call of use();
	so this.time should generally be initialized in use() and decremented in update().
If there is to be a delay before the person may use another SLVDE.Action of the same class, don't let this.time reach zero
	and let the last bit of the count do nothing in this.update()
If there is to be a delay before the person may use this same SLVDE.Action, set some property of the SLVDE.Action
	(e.g. this.rcvr) to a significant number which canUse may reference
*/

SLVDE.Action = {};

// console.log("loaded SLVDE.Action");

function baseAction() { }
baseAction.prototype.time = 0;
baseAction.prototype.prob = 1;
baseAction.prototype.type = "attack";
baseAction.prototype.getProbability = function() { return this.prob; };
baseAction.prototype.canUse = function(person) { return true; };
baseAction.prototype.use = function(person) { };
baseAction.prototype.update = function(person) { this.time--; };
baseAction.prototype.see = function(person) { };

SLVDE.Action["slash"] = function(prob) {
	if(prob !== undefined)
	{
		this.prob = prob;
	}
};
SLVDE.Action["slash"].prototype = new baseAction();
SLVDE.Action["slash"].prototype.constructor = SLVDE.Action["slash"];
SLVDE.Action["slash"].prototype.time = 4;
SLVDE.Action["slash"].prototype.canUse = function(person) {
	return SLVDE.distanceTrue(person.x, person.y, SLVDE.player[SLVDE.currentPlayer].x, SLVDE.player[SLVDE.currentPlayer].y) < 36 && person.canSeePlayer();
};
SLVDE.Action["slash"].prototype.use = function(person) {
	this.time = 4;
	for(var third = 0; third < SLVDE.boardAgent.length; third++)
	{
		if(SLVDE.boardAgent[third].team != person.team)
		{
			//One tile away
			var caseTRPG = Math.pow(SLVDE.xPixToTile(SLVDE.boardAgent[third].x) - SLVDE.xPixToTile(person.x), 2) + Math.pow(SLVDE.yPixToTile(SLVDE.boardAgent[third].y) - SLVDE.yPixToTile(person.y), 2) == 1;
			//Distance < 40
			var caseZelda = Math.sqrt(Math.pow(SLVDE.boardAgent[third].x - person.x, 2) + Math.pow(SLVDE.boardAgent[third].y - person.y, 2)) < 40;

			if((SLVDE.process == "TRPG" && caseTRPG) || (SLVDE.process == "zelda" && caseZelda))
			{
				//Determine angle between slasher and opponent (in terms of PI/2)
				var angle = SLVDE.dirFromTo(person.x, person.y, SLVDE.boardAgent[third].x, SLVDE.boardAgent[third].y);

				//Compare angle to direction of slasher. If in range of PI... and if not already hurt and not invincible
				if((Math.abs(angle - person.dir) < 1 || Math.abs(angle - person.dir) > 3) && SLVDE.boardAgent[third].status != "hurt" && SLVDE.boardAgent[third].status != "invincible")
				{
					SLVDE.boardAgent[third].zeldaBump(16, angle);
					SLVDE.boardAgent[third].damage(5);
					SLVDE.boardAgent[third].giveStatus(new SLVDE.Status["hurt"](1));
				}
			}
		}
	}
};
SLVDE.Action["slash"].prototype.update = function(person) {
	if(this.time <= 0)
	{
		//person.rcvr = 16 - person.spd;
	}
	this.time--;
};
SLVDE.Action["slash"].prototype.see = function(person) {
	//Blur SLVDE.player
	SLVDE.snapShotCtx.globalAlpha = 0.10;
	var tSqueeze = 4;
	var col = person.getStance();
	for(var third = -12; third < 12; third++)
	{
		SLVDE.snapShotCtx.drawImage(person.getImage(), person.xres*col, person.yres*person.frame, person.xres, person.yres, third*Math.cos(Math.PI/2*(4 - Math.round(person.dir))) - person.xres/2 - person.baseOffX, tSqueeze + third*Math.sin(Math.PI/2*(4 - Math.round(person.dir))) - person.yres + person.baseLength/2 - person.baseOffY, person.xres, person.yres - tSqueeze);
	}
	SLVDE.snapShotCtx.globalAlpha = 1;

	//Draw arc
	SLVDE.snapShotCtx.lineWidth = 8;
	SLVDE.snapShotCtx.beginPath();
	SLVDE.snapShotCtx.arc(0, 0, 32, 0.5*((3 - person.dir) - 0.5 + (this.time/2))*Math.PI, 0.5*((3 - person.dir) + 0.5 + (this.time/2))*Math.PI);
	SLVDE.snapShotCtx.strokeStyle = "white";
	SLVDE.snapShotCtx.stroke();
};
