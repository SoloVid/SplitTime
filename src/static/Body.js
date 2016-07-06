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
SplitTime.Body.prototype.addStaticTrace = function(traceStr, color) {
	if(this.staticTrace.length === 0)
		this.staticTrace = [];
	this.staticTrace.push({traceStr: traceStr, color: color});
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

SplitTime.Body.prototype.act = [];
SplitTime.Body.prototype.pushAct = function(item) {
	if(this.act.length === 0) {
		this.act = [];
	}
	this.act.push(item);
};
SplitTime.Body.prototype.spliceAct = function(index, length) {
	this.act.splice(index, length);
	if(this.act.length <= 0)
	{
		delete this.act;
	}
};
SplitTime.Body.prototype.actSet = [];
SplitTime.Body.prototype.rcvr = 0;
SplitTime.Body.prototype.getAct = function(index) {
	return this.act[index];
};
SplitTime.Body.prototype.getActTime = function(index) {
	return this.act[index][1];
};
SplitTime.Body.prototype.getActOpt = function(index) {
	return this.actSet[index];
};
SplitTime.Body.prototype.getActOptProb = function(index) {
	return this.actSet[index].prob;
};
SplitTime.Body.prototype.handleAction = function() {
	if(this.canAct)
	{
		//Start new action
		var newAct = this.pickAction();
		if(newAct !== null)
		{
			this.pushAct(newAct);
			newAct.use(this);
		}

		//Handle persistent actions
		for(var i = 0; i < this.act.length; i++)
		{
			var currentAct = this.getAct(i);
			currentAct.update(this);
			if(currentAct.time <= 0)
			{
				this.spliceAct(i, 1);
				if(SplitTime.process == "TRPG")
				{
					SplitTime.TRPGNextTurn(); //in TRPG.js
				}
			}
		}
	}
};
SplitTime.Body.prototype.pickAction = function() {
	var actSet = [];
	var rand, i;
	var totProb = 0;
	//Create a list of useable actions
	for(i = 0; i < this.actSet.length; i++)
	{
		var actOpt = this.getActOpt(i);
		if(actOpt.canUse(this))
		{
			var typeTaken = false;
			for(var j = 0; j < this.act.length; j++)
			{
				if(actOpt.type == this.getAct(j).type)
				{
					typeTaken = true;
					j = this.act.length;
				}
			}
			if(!typeTaken)
			{
				actSet.push(actOpt);
				totProb += actOpt.getProbability();
			}
		}
	}

	//In case of one (will normally work unless "zero probability" of default actions)
	if(actSet.length > 0 && totProb <= 0)
	{
		return actSet[0];
	}

	//Pick random action based on probabilities
	rand = SLVD.randomInt(totProb);
	var partProb = 0;
	for(i = 0; i < actSet.length; i++)
	{
		partProb += actSet[i].getProbability();
		if(rand <= partProb)
		{
			return actSet[i];
		}
	}
	return null;
};
SplitTime.Body.prototype.requestAction = function(action) {
	if(this.canAct)
	{
		var typeTaken = false;
		for(var j = 0; j < this.act.length; j++)
		{
			if(action.type == this.getAct(j).type)
			{
				typeTaken = true;
				j = this.act.length;
			}
		}
		if(!typeTaken)
		{
			this.pushAct(action);
			action.use(this);
		}
	}
};
SplitTime.Body.prototype.seeAction = function() {
	for(var i = 0; i < this.act.length; i++)
	{
		this.act[i].see(this);
	}
};

SplitTime.Body.prototype.status = [];
SplitTime.Body.prototype.handleStatus = function() {
	if(this.status.length > 0)
	{
		for(var i = 0; i < this.status.length; i++)
		{
			var currentStatus = this.status[i];
			currentStatus.apply(this);
			currentStatus.time--;
			if(currentStatus.time <= 0)
			{
				this.status.splice(i, 1);
			}
		}
	}
};
SplitTime.Body.prototype.seeStatus = function() {
	for(var i = 0; i < this.status.length; i++)
	{
		this.status[i].see(this);
	}
};

//SplitTime.Body.prototype.moveSet = [];

SplitTime.Body.prototype.keyFunc = {};
//Function run on ENTER or SPACE
SplitTime.Body.prototype.interact = function() {};

SplitTime.Body.prototype.pushy = true;

SplitTime.Body.prototype.sx = 0;
SplitTime.Body.prototype.sy = 0;
SplitTime.Body.prototype.stance = "default";
SplitTime.Body.prototype.requestedStance = "default";
SplitTime.Body.prototype.requestedFrameReset = false;
SplitTime.Body.prototype.frame = 0;

SplitTime.Body.prototype.stances = {
    "default": {
        "S": 0,
        "N": 1,
        "E": 2,
        "W": 3,
    }
};

SplitTime.Body.prototype.defaultStance = function() {
	this.requestStance("default", true);
};

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
	if(this.img)
	{
		if(!(this.img in SplitTime.image))
		{
			SplitTime.image[this.img] = new Image();
			SplitTime.image[this.img].src = "images/" + this.img.replace(/\"/g, "");
		}
		//this.img = SplitTime.image[this.img];
	}
	return SplitTime.image[this.img];
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

SplitTime.Body.prototype.dart = {};

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

//All of the "give" functions are intended to be passed a "new" object
SplitTime.Body.prototype.giveAction = function(action, keyFuncHandle) {
	if(this.actSet.length === 0)
	{
		this.actSet = [];
	}

	if((typeof action) == "string")
	{
		action = new SplitTime.Action[action]();
	}

	this.actSet.push(action);

	if(keyFuncHandle !== undefined)
	{
		var tempKeyFunc = {};

		for(var i in this.keyFunc)
		{
			tempKeyFunc[i] = this.keyFunc[i];
		}

		tempKeyFunc[keyFuncHandle] = (function(person, act) {
			// console.log("assigned " + person + " with " + act + " on " + keyFuncHandle);
			return function() {
				// console.log("using action");
				person.pushAct(act);
				act.use(person);
			};
		} (this, action));

		this.keyFunc = tempKeyFunc;
	}
};
SplitTime.Body.prototype.giveStatus = function(status) {
	if(this.status.length === 0)
	{
		this.status = [];
	}

	if((typeof status) == "string")
	{
		status = new SplitTime.Status[status]();
	}

	this.status.push(status);
};

SplitTime.Body.prototype.hasStatus = function(status) {
	if((typeof status) == "string")
	{
		status = SplitTime.Status[status];
	}

	for(var i = 0; i < this.status.length; i++)
	{
		if(this.status[i] instanceof status)
		{
			return true;
		}
	}
	return false;
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

SplitTime.Body.prototype.say = function(message, overrideName) {
	SplitTime.personSays(this, message, overrideName);
};
SplitTime.Body.prototype.see = function(ctx) {
	if(!ctx)
	{
		ctx = SplitTime.see;
	}

	if(!this.canSee) return;

	var canvSeeX = this.x - SplitTime.wX - SplitTime.SCREENX/2 + this.offX - SplitTime.player[SplitTime.currentPlayer].offX;
	var canvSeeY = this.y - SplitTime.wY - SplitTime.SCREENY/2 + this.offY - SplitTime.player[SplitTime.currentPlayer].offY;

	if(canvSeeX < -SplitTime.SCREENX || canvSeeY < -SplitTime.SCREENY || canvSeeX > SplitTime.SCREENX || canvSeeY > SplitTime.SCREENY)
	{
		return;
	}

	// ctx.setTransform(1, 0, 0, 1, 0, 0);

	ctx.translate(this.x - SplitTime.wX + this.offX - SplitTime.player[SplitTime.currentPlayer].offX, this.y - SplitTime.wY + this.offY - SplitTime.player[SplitTime.currentPlayer].offY);

	ctx.rotate(this.rotate);

	//SplitTime.boardBody is displayed partially transparent depending on health (<= 50% transparent)
	//ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

	this.draw(ctx);
	// var col = this.getStance(); //in functions.js
	// var tImg = this.getImage();
	// var sx = this.xres*col;
	// var sy = this.yres*this.frame;
	// var pos = this.getShownPosition();
	// var x = -Math.round(this.xres/2) - this.baseOffX;
	// var y = -this.yres + Math.round(this.baseLength/2) - this.baseOffY;
	// ctx.drawImage(tImg, sx, sy, this.xres, this.yres, x, y, this.xres, this.yres);

	//ctx.globalAlpha = 1;

	this.seeAction();
	this.seeStatus();

	//ctx.rotate(-this.rotate);

	ctx.setTransform(1, 0, 0, 1, 0, 0);

	delete this.rotate;
};

SplitTime.Body.prototype.draw = function(ctx) {
    this.finalizeStance();

    var tImg = this.getImage();
    var x = -Math.round(this.xres/2) - this.baseOffX;
    var y = -this.yres - this.baseOffY;
    ctx.drawImage(tImg, this.sx, this.sy, this.xres, this.yres, x, y, this.xres, this.yres);
};

SplitTime.Body.prototype.finalizeFrame = function() {
    if(this.stance != this.requestedStance || this.requestedFrameReset) {
        this.frame = 0;
    }
    else {
        //Only update on frame tick
        if(SplitTime.frameClock == 1)
        {
            this.frame++;
            if(this.getImage().height <= this.frame*this.yres)
            {
                this.frame = 0;
            }
        }
    }
};

SplitTime.Body.prototype.finalizeStance = function() {
	var column = 0;
	var dir = SplitTime.directionToString(this.dir);

    //Allow for non-complicated spritesheets with one column
    if(!this.stances) {
        return;
    }


    if(!this.requestedStance || !(this.requestedStance in this.stances)) {
        this.requestedStance = "default";
    }
    this.finalizeFrame();
    this.stance = this.requestedStance;

    if(!(this.stances[this.stance] instanceof Object)) {
        column = this.stances[this.stance];
    }
    else {
        //If shorten intermediate directions to cardinal if they are not specified
        if(!(dir in this.stances[this.stance])) {
            dir = SplitTime.directionToString(Math.round(this.dir) % 4);
        }

        if(dir in this.stances[this.stance]) {
            column = this.stances[this.stance][dir];
        }
        else {
            console.warn("Stance " + this.stance + " missing direction " + dir);
            column = 0;
        }
    }

    this.sx = this.xres*column;
    this.sy = this.yres*this.frame;
};

SplitTime.Body.prototype.requestStance = function(stance, forceReset) {
    this.requestedStance = stance;
    this.requestedFrameReset = forceReset;
};

SplitTime.Body.prototype.resetStance = function() {
    this.requestedStance = "default";
    this.requestedFrameReset = false;
};

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

//zeldaStep but with input direction
SplitTime.Body.prototype.zeldaBump = function(distance, direction) {
	//Save direction
	var tDir = this.dir;
	//Set direction
	this.dir = direction;
	//Bump
	this.zeldaStep(distance);
	//Revert direction;
	this.dir = tDir;
};
SplitTime.Body.prototype.zeldaCheckStep = function(axis, altAxis, isPositive) {
	var refinedNearbyBodies = [];

	var pixel, i;
	var coords = {};

	coords[axis] = isPositive ? this[axis] + Math.round(this.baseLength/2) - 1 : this[axis] - Math.round(this.baseLength/2);

	//Loop through width of base
	for(i = -this.baseLength/2; i < this.baseLength/2; i++)
	{
		coords[altAxis] = this[altAxis] + i;
		pixel = SplitTime.getPixel(coords.x, coords.y, SplitTime.currentLevel.layerFuncData[this.layer]);
		if(pixel[0] == 255) //If pixel on func map has R=255
		{
			//Don't worry if Y=255 (open air) and person is inAir
			if(this.inAir == 1 && pixel[1] == 255) { }
			else //Otherwise, stop person
			{
				return true;
			}
		}
		else if(pixel[0] == 100 && pixel[1] === 0) //If R=255 & G=0
		{
			//Prepare function
			resumeFunc = SplitTime.currentLevel.boardProgram[pixel[2]];
			resumeCue = resumeFunc(0);
		}
	}

	//Check for collision with people
	for(i = 0; i < this.nearbyBodies.length; i++)
	{
		var currentAgent = this.nearbyBodies[i];
		if(this.team != currentAgent.team && currentAgent.baseLength > 0)
		{
			var collisionDist = (this.baseLength + currentAgent.baseLength)/2;
			// if(Math.abs(this.y - currentAgent.y) < collisionDist)
			var distTrue = SplitTime.distanceTrue(this.x, this.y, currentAgent.x, currentAgent.y);
			if(distTrue < this.stepDistanceRemaining) {
				refinedNearbyBodies.push(currentAgent);
				if(distTrue < collisionDist)
				{
					var dDir = Math.abs(SplitTime.dirFromTo(this.x, this.y, currentAgent.x, currentAgent.y) - this.dir);
					if(dDir < 1 || dDir > 3)
					// if(Math.abs(this.x - currentAgent.x) < collisionDist)
					{
						//The .pushing here ensures that there is no infinite loop of pushing back and forth
						if(this.pushy && currentAgent.pushy && currentAgent.pushing != this)
						{
							this.pushing = currentAgent;
							currentAgent.zeldaBump(this.spd/2, this.dir);
							delete this.pushing;
						}
						return true;
					}
				}
			}
		}
	}

	this.nearbyBodies = refinedNearbyBodies;

	return false;
};
SplitTime.Body.prototype.zeldaLockOnPlayer = function() {
	this.zeldaLockOnPoint(SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y);
};
SplitTime.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
	this.dir = SplitTime.dirFromTo(this.x, this.y, qx, qy);
};
//*********Advances SplitTime.Body person up to distance distance as far as is legal. Includes pushing other Bodys out of the way? Returns -1 if stopped before distance?
SplitTime.Body.prototype.zeldaStep = function(distance) {
	var stopped = false;
	var stoppedTemp = false;
	var out = false;
	var ret = 1; //value to return at end
	var dy = -(Math.round(distance*Math.sin((this.dir)*(Math.PI/2)))); //Total y distance to travel
	var dx = Math.round(distance*Math.cos((this.dir)*(Math.PI/2))); //Total x distance to travel
	this.stepDistanceRemaining = dx + dy;
	this.nearbyBodies = SplitTime.boardAgent;
	var i, j, k;
	//Handle y movement
	for(i = 0; i < Math.abs(dy); i++)
	{
		this.y += (dy/Math.abs(dy));
		//Check if out of bounds
		if(this.y >= SplitTime.currentLevel.height || this.y < 0)
		{
			out = true;
		}
		else
		{
			stoppedTemp = this.zeldaCheckStep("y", "x", dy > 0);
		}

		if(stoppedTemp || out)
		{
			this.y -= (dy/Math.abs(dy));
			break;
		}
		this.stepDistanceRemaining--;
	}
	stopped = stoppedTemp;
	//Handle x movement;
	for(i = 0; i < Math.abs(dx); i++)
	{
		this.x += (dx/Math.abs(dx));
		if(this.x >= SplitTime.currentLevel.width || this.x < 0)
		{
			out = true;
		}
		else
		{
			stoppedTemp = this.zeldaCheckStep("x", "y", dx > 0);
		}

		if(stoppedTemp || out)
		{
			this.x -= (dx/Math.abs(dx));
			i = Math.abs(dx);
		}
		this.stepDistanceRemaining--;
	}
	stopped = stoppedTemp || stopped;
	var dir = this.dir;
	//If stopped, help person out by sliding around corner
	if(stopped && !out )
	{
		ret = -1;
		for(i = 0; i < 1; i++)
		{

		var halfBase = Math.round(this.baseLength/2);

		if(dir < 1 || dir > 3) //case 0:
		{
			j = SplitTime.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, SplitTime.currentLevel.layerFuncData[this.layer]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y + halfBase, SplitTime.currentLevel.layerFuncData[this.layer]);
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.y -= 1; }
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.y += 1; }
		}
		if(dir > 0 && dir < 2) //case 1:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, SplitTime.currentLevel.layerFuncData[this.layer]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, SplitTime.currentLevel.layerFuncData[this.layer]);
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.x -= 1; }
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.x += 1; }
		}
		if(dir > 1 && dir < 3) //case 2:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, SplitTime.currentLevel.layerFuncData[this.layer]);
			k = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, SplitTime.currentLevel.layerFuncData[this.layer]);
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.y -= 1; }
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.y += 1; }
		}
		if(dir > 2 && dir < 4) //case 3:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, SplitTime.currentLevel.layerFuncData[this.layer]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y + halfBase, SplitTime.currentLevel.layerFuncData[this.layer]);
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.x -= 1; }
			if(SplitTime.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.x += 1; }
		}
		}
	}
	else if(out == 1)
	{
		ret = -1;
	}
	stopped = false;
	out = false;

	delete this.nearbyBodies;
	delete this.stepDistanceRemaining;

	return ret;
};
