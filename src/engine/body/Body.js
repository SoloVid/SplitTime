SplitTime.Body = function() {};
SplitTime.BodyTemplate = {};
SplitTime.BodyTemplate[""] = new SplitTime.Body();

SplitTime.Body.prototype.childrenBolted = [];
SplitTime.Body.prototype.childrenLoose = [];
SplitTime.Body.prototype.addChild = function(child, isBolted) {
	if(isBolted) {
		if(this.childrenBolted.length === 0)
			this.childrenBolted = [];
		this.childrenBolted.push(child);
	}
	else {
		if(this.childrenLoose.length === 0)
			this.childrenLoose = [];
		this.childrenLoose.push(child);
	}
};
SplitTime.Body.prototype.removeChild = function(child) {
	var i;
	for(i = 0; i < this.childrenBolted.length; i++) {
		if(this.childrenBolted[i] == child) {
			this.childrenBolted.splice(i, 1);
			i--;
		}
	}
	for(i = 0; i < this.childrenLoose.length; i++) {
		if(this.childrenLoose[i] == child) {
			this.childrenLoose.splice(i, 1);
			i--;
		}
	}
};
SplitTime.Body.prototype.getChildren = function() {
	return this.childrenBolted.concat(this.childrenLoose);
};

SplitTime.Body.prototype.isCurrentPlayer = function() {
	return this === SplitTime.Player.getActiveBody();
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

SplitTime.Body.prototype._level = undefined;
SplitTime.Body.prototype.team = "neutral";
SplitTime.Body.prototype.x = 0;
SplitTime.Body.prototype.getX = function() {
	return this.x;
};
SplitTime.Body.prototype.setX = function(x) {
	var children = this.getChildren();
	for(var i = 0; i < children.length; i++) {
		var currentChild = children[i];
		var dx = currentChild.x - this.x;
		currentChild.setX(x + dx);
	}
	this.x = x;
};
SplitTime.Body.prototype.y = 0;
SplitTime.Body.prototype.getY = function() {
    return this.y;
};
SplitTime.Body.prototype.setY = function(y) {
	var children = this.getChildren();
	for(var i = 0; i < children.length; i++) {
		var currentChild = children[i];
		var dy = currentChild.y - this.y;
		currentChild.setY(y + dy);
	}
	this.y = y;
};
SplitTime.Body.prototype.offX = 0;
SplitTime.Body.prototype.offY = 0;
SplitTime.Body.prototype.z = 0;
SplitTime.Body.prototype.getZ = function() {
    return this.z;
};
SplitTime.Body.prototype.setZ = function(layer) {
	var children = this.getChildren();
	for(var i = 0; i < children.length; i++) {
		var currentChild = children[i];
		var dLayer = currentChild.z - this.z;
		currentChild.setZ(layer + dLayer);
	}
	this.z = layer;
};

SplitTime.Body.prototype.dir = 3;

SplitTime.Body.prototype.isInCurrentLevel = function() {
    return this.getLevel() === SplitTime.Level.getCurrent();
};

SplitTime.Body.prototype.put = function(level, x, y, layer) {
	this.setLevel(level);
	this.setX(x);
	this.setY(y);
	this.setZ(layer);
};

SplitTime.Body.prototype.setLevel = function(level) {
	if(typeof level === "string") {
		level = SplitTime.Level.get(level);
	}

	if(this._level) {
		this._level.removeBody(this);
	}

    this._level = level;
    this._level.insertBody(this);

    var children = this.getChildren();
    for(var i = 0; i < children.length; i++) {
        children[i].setLevel(level);
    }

    this.timeStabilizer = level.getRegion().getTimeStabilizer(200);
};
SplitTime.Body.prototype.getLevel = function() {
	return this._level;
};
SplitTime.Body.prototype.getRegion = function() {
	var level = this.getLevel();
	if(!level) {
		return SplitTime.Region.getDefault();
	}
	return level.getRegion();
};

SplitTime.Body.prototype.agent = null;
SplitTime.Body.prototype.getAgent = function() {
	return this.agent;
};
SplitTime.Body.prototype.setAgent = function(agent) {
	this.agent = agent;
	if(typeof agent.setBody === "function") {
		agent.setBody(this);
	}
};

SplitTime.Body.prototype.keyFunc = {};
//Function run on ENTER or SPACE
SplitTime.Body.prototype.interact = function() {};

SplitTime.Body.prototype.pushy = true;

SplitTime.Body.prototype.canAct = true;
//SplitTime.Body.prototype.canMove = true;
SplitTime.Body.prototype.canSeeAct = true;
//SplitTime.Body.prototype.canSeeMove = true;
SplitTime.Body.prototype.canSeeStatus = true;
SplitTime.Body.prototype.canSee = true;

SplitTime.Body.prototype.getImage = function() {
	return SplitTime.Image.get(this.img);
};
SplitTime.Body.prototype.getPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.z = this.z;
	return pos;
};
SplitTime.Body.prototype.getShownPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.z = this.z;
	return pos;
};
SplitTime.Body.prototype.getShownX = function() {
	return this.x;
};
SplitTime.Body.prototype.getShownY = function() {
	return this.y;
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
	for(var iX = 0; iX < 8; iX++) {
		for(var iY = 0; iY < 16; iY++) {
			var iData = SplitTime.pixCoordToIndex(this.x + iY, this.y + iX, SplitTime.currentLevel.layerFuncData[this.z]);
			if(SplitTime.currentLevel.layerFuncData[this.z].data[iData] == 255) {
				if(allowInAir == 1 && SplitTime.currentLevel.layerFuncData[this.z].data[iData + 1] == 255) { }
				else return 0;
			}
		}
	}
	return 1;
};

SplitTime.Body.prototype.canSeeBody = function(body) {
    var tDir = SplitTime.Direction.fromTo(this.x, this.y, body.x, body.y);
    return (Math.abs(tDir - this.dir) < 1 || Math.abs(tDir - this.dir) > 3);
};

SplitTime.Body.prototype.canSeePlayer = function() {
    var player = SplitTime.Player.getActiveBody();
    var tDir = SplitTime.Direction.fromTo(this.x, this.y, player.x, player.y);
    return (Math.abs(tDir - this.dir) < 1 || Math.abs(tDir - this.dir) > 3);
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
// 				event = new Function("var tNPC = SplitTime.getNPCByName(\"" + this.name + "\"); tNPC.x = " + eventA[i + 1] + "; tNPC.y = " + eventA[i + 2] + "; tNPC.z = " + eventA[i + 3] + ";");
// 				SplitTime.Time.registerEvent(event, isDaily, cTime);
// 				i += 4;
//
// 				nx = eventA[i + 1];
// 				ny = eventA[i + 2];
// 			}
// 			else if(eventA[i] == "send")
// 			{
// 				event = new Function("var tNPC = SplitTime.getNPCByName(\"" + this.name + "\"); tNPC.lvl = " + eventA[i + 1] + "; tNPC.x = " + eventA[i + 2] + "; tNPC.y = " + eventA[i + 3] + "; tNPC.z = " + eventA[i + 4] + ";");
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

