SplitTime.Body = function() {};
SplitTime.BodyTemplate = {};
SplitTime.BodyTemplate[""] = new SplitTime.Body();

SplitTime.Body.prototype.children = [];
SplitTime.Body.prototype.addChild = function(child) {
	if(this.children.length === 0)
		this.children = [];

	this.children.push(child);
};

SplitTime.Body.prototype.staticTrace = [];
SplitTime.Body.prototype.addStaticTrace = function(traceStr, type) {
	if(this.staticTrace.length === 0)
		this.staticTrace = [];
	this.staticTrace.push({traceStr: traceStr, type: type});
};

SplitTime.Body.prototype.xres = 32;
SplitTime.Body.prototype.yres = 64;

//The SplitTime.Body's base is the collision area of the SplitTime.Body
SplitTime.Body.prototype.baseLength = 16;
SplitTime.Body.prototype.baseX = 16;
SplitTime.Body.prototype.baseY = 8;
//Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
SplitTime.Body.prototype.baseOffX = 0;
SplitTime.Body.prototype.baseOffY = 0;

SplitTime.Body.prototype.omniDir = false;
SplitTime.Body.prototype.rotate = 0;

SplitTime.Body.prototype.lvl = undefined;
SplitTime.Body.prototype.team = "neutral";
SplitTime.Body.prototype.x = 0;
SplitTime.Body.prototype.setX = function(x) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dx = currentChild.x - this.x;
		currentChild.setX(x + dx);
	}
	this.x = x;
};
SplitTime.Body.prototype.y = 0;
SplitTime.Body.prototype.setY = function(y) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dy = currentChild.y - this.y;
		currentChild.setY(y + dy);
	}
	this.y = y;
};
SplitTime.Body.prototype.offX = 0;
SplitTime.Body.prototype.offY = 0;
SplitTime.Body.prototype.layer = 0;
SplitTime.Body.prototype.setLayer = function(layer) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dLayer = currentChild.layer - this.layer;
		currentChild.setLayer(layer + dLayer);
	}
	this.layer = layer;
};
//SplitTime.Body.prototype.inAir = null;
//SplitTime.Body.prototype.mvmt = 1; //0 - still; 1 - random moving; 2 - back and forth; 4 - square
//SplitTime.Body.prototype.speech; //0/"" or message
// SplitTime.Body.prototype.dmnr = 1; //0 - peaceful; 1 - excitable; 2 - aggressive
SplitTime.Body.prototype.dir = 3;
// SplitTime.Body.prototype.steps = 0;// = 5;
// SplitTime.Body.prototype.wait = undefined;// = 0;

SplitTime.Body.prototype.put = function(levelId, x, y, layer) {
	this.lvl = levelId;
	this.setX(x);
	this.setY(y);
	this.setLayer(layer);
};

SplitTime.Body.prototype.keyFunc = {};
//Function run on ENTER or SPACE
SplitTime.Body.prototype.interact = function() {};

SplitTime.Body.prototype.pushy = true;

SplitTime.Body.prototype.hp = 100;
SplitTime.Body.prototype.strg = 5;
SplitTime.Body.prototype.spd = 2;

SplitTime.Body.prototype.path = [];
SplitTime.Body.prototype.addPointToPath = function(x, y) {
	if(this.path.x.length === 0)
	{
		this.path = [];
	}
	this.path.unshift({x: x, y: y});
};

SplitTime.Body.prototype.canAct = true;
//SplitTime.Body.prototype.canMove = true;
SplitTime.Body.prototype.canSeeAct = true;
//SplitTime.Body.prototype.canSeeMove = true;
SplitTime.Body.prototype.canSeeStatus = true;
SplitTime.Body.prototype.canSee = true;

SplitTime.Body.prototype.getHp = function() {
	return this.hp;
};
SplitTime.Body.prototype.getImage = function() {
	return SplitTime.Image.get(this.img);
};
SplitTime.Body.prototype.getMaxHp = function() {
	return 100;
};
SplitTime.Body.prototype.getPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.layer = this.layer;
	return pos;
};
SplitTime.Body.prototype.getShownPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.layer = this.layer;
	return pos;
};
SplitTime.Body.prototype.getShownX = function() {
	return this.x;
};
SplitTime.Body.prototype.getShownY = function() {
	return this.y;
};
SplitTime.Body.prototype.getSpeed = function() {
	return this.spd;
};
SplitTime.Body.prototype.getStrength = function() {
	return this.strg;
};
SplitTime.Body.prototype.getTeam = function() {
	return SplitTime.Teams[this.team];
};

SplitTime.Body.prototype.preventAction = function() { this.canAct = false; };
SplitTime.Body.prototype.preventActionSee = function() { this.canSeeAct = false; };
SplitTime.Body.prototype.preventStatusSee = function() { this.canSeeStatus = false; };
SplitTime.Body.prototype.preventRender = function() { this.canSee = false; };
SplitTime.Body.prototype.resetCans = function() { delete this.canSee; delete this.canAct; delete this.canSeeAct; delete this.canSeeStatus; };

// SplitTime.Body.prototype.dart = {};

//Checks if the a SplitTime.Body's location is valid (based on current location and layer func data)
SplitTime.Body.prototype.canBeHere = function(allowInAir) {
	for(var ind = 0; ind < 8; ind++)
	{
		for(var sec = 0; sec < 16; sec++)
		{
			var i = SplitTime.pixCoordToIndex(person.x + sec, person.y + ind, SplitTime.currentLevel.layerFuncData[person.layer]);
			if(SplitTime.currentLevel.layerFuncData[person.layer].data[i] == 255)
			{
				if(allowInAir == 1 && SplitTime.currentLevel.layerFuncData[person.layer].data[i + 1] == 255) { }
				else return 0;
			}
		}
	}
	return 1;
};

SplitTime.Body.prototype.canSeePlayer = function() {
	var tDir = SplitTime.dirFromTo(this.x, this.y, SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y);
	return (Math.abs(tDir - this.dir) < 1 || Math.abs(tDir - this.dir) > 3);
};

SplitTime.Body.prototype.damage = function(amount) {
	this.hp -= amount;
};

//Move a person along their set path at given speed.
SplitTime.Body.prototype.pathMotion = function(spd) {
	var dist = Math.sqrt(Math.pow(this.x - this.path[0].x, 2) + Math.pow(this.y - this.path[0].y, 2));
	if(dist === 0)
	{
		this.path.shift();

		if(this == SplitTime.cTeam[SplitTime.currentPlayer] && this.path.length === 0)
		{
			if(!resumeCue)	{ }
			else { resumeCue = resumeFunc(resumeCue); }
		}
	}
	else
	{
		this.zeldaLockOnPoint(this.path[0].x, this.path[0].y);
		var jump;
		// if(Math.round(dist) < spd) { jump = Math.round(dist); }
		if(dist < spd) { jump = dist; }
		else { jump = spd; }
		this.y -= Math.round(jump*Math.sin((this.dir)*(Math.PI/2)));
		this.x += Math.round(jump*Math.cos((this.dir)*(Math.PI/2)));
	}
};

//Based in time.js, this SplitTime.provides = function simple interface for setting a timed sequence of movement events for Bodys
// SplitTime.Body.prototype.registerWalkEvent = function(eventA, isDaily, day, hour, minute, second) {
// 	/*eventA should be an array with specific sequences of "arguments". Acceptable forms:
// 		coordinates: x, y
// 		abrupt relocation: "put", x, y, z
// 		move to new board: "send", [board name], x, y, z
// 		call function: "function", [function object] (this is intended for simple things like sound effects)
// 	*/
// 	if(isDaily)
// 	{
// 		day = 0;
// 	}
// 	var cTime = SplitTime.Time.componentToAbsolute(day, hour, minute, second);
// 	var nTime = cTime;
//
// 	var i = 0;
// 	var ptA = [];
//
// 	var cx, cy;
// 	var nx = this.x;
// 	var ny = this.y;
//
// 	while(i < eventA.length)
// 	{
// 		if(typeof eventA[i] == "number")
// 		{
// 			cx = nx;
// 			cy = ny;
// 			nx = eventA[i];
// 			ny = eventA[i + 1];
// 			ptA.push(nx);
// 			ptA.push(ny);
// 			i += 2;
// 			var tDir = SplitTime.dirFromTo(cx, cy, nx, ny); //in functions.js
//
// 			//Single step component distances
// 			var dy = Math.round(this.spd*Math.sin((tDir)*(Math.PI/2)));
// 			var dx = Math.round(this.spd*Math.cos((tDir)*(Math.PI/2)));
//
// 			//Frames used to travel between points
// 			var f = Math.ceil(Math.abs(nx - cx)/dx) || Math.ceil(Math.abs(ny - cy)/dy);
//
// 			//Expect next event's time to be f frames farther
// 			nTime += f;
// 			if(isDaily)
// 			{
// 				nTime = nTime%(60*60*24);
// 			}
// 		}
// 		else
// 		{
// 			var event;
// 			if(ptA.length > 0)
// 			{
// 				event = new Function("var tNPC = SplitTime.getNPCByName(\"" + this.name + "\"); tNPC.walkPath(" + ptA.toString() + ");");
// 				SplitTime.Time.registerEvent(event, isDaily, cTime);
// 				ptA.length = 0;
// 				cTime = nTime + 8; //tack on a few extra frames to be safe
// 			}
//
// 			if(eventA[i] == "put")
// 			{
// 				event = new Function("var tNPC = SplitTime.getNPCByName(\"" + this.name + "\"); tNPC.x = " + eventA[i + 1] + "; tNPC.y = " + eventA[i + 2] + "; tNPC.layer = " + eventA[i + 3] + ";");
// 				SplitTime.Time.registerEvent(event, isDaily, cTime);
// 				i += 4;
//
// 				nx = eventA[i + 1];
// 				ny = eventA[i + 2];
// 			}
// 			else if(eventA[i] == "send")
// 			{
// 				event = new Function("var tNPC = SplitTime.getNPCByName(\"" + this.name + "\"); tNPC.lvl = " + eventA[i + 1] + "; tNPC.x = " + eventA[i + 2] + "; tNPC.y = " + eventA[i + 3] + "; tNPC.layer = " + eventA[i + 4] + ";");
// 				SplitTime.Time.registerEvent(event, isDaily, cTime);
// 				i += 5;
//
// 				nx = eventA[i + 2];
// 				ny = eventA[i + 3];
// 			}
// 			else if(eventA[i] == "function")
// 			{
// 				SplitTime.Time.registerEvent(eventA[i + 1], isDaily, cTime);
// 			}
// 		}
// 	}
// };

//(x1, y1, x2, y2, ...)
SplitTime.Body.prototype.walkPath = function() {
	if(SplitTime.currentLevel == this.level)
	{
		var spd = this.spd;
		for(var i = 0; i < arguments.length; i += 2)
		{
			this.addPointToPath(arguments[i], arguments[i + 1]);
		}
	}
	else
	{
		this.setX(arguments[arguments.length - 2]);
		this.setY(arguments[arguments.length - 1]);
	}
};
