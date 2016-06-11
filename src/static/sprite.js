SLVDE.Body = function() {};
SLVDE.BodyTemplate = {};
SLVDE.BodyTemplate[""] = new SLVDE.Body();

SLVDE.Body.prototype.children = [];
SLVDE.Body.prototype.addChild = function(child) {
	if(this.children.length === 0)
		this.children = [];

	this.children.push(child);
};

SLVDE.Body.prototype.staticTrace = [];
SLVDE.Body.prototype.addStaticTrace = function(traceStr, color) {
	if(this.staticTrace.length === 0)
		this.staticTrace = [];
	this.staticTrace.push({traceStr: traceStr, color: color});
};

SLVDE.Body.prototype.xres = 32;
SLVDE.Body.prototype.yres = 64;

//The SLVDE.Body's base is the collision area of the SLVDE.Body
SLVDE.Body.prototype.baseLength = 16;
SLVDE.Body.prototype.baseX = 16;
SLVDE.Body.prototype.baseY = 8;
//Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
SLVDE.Body.prototype.baseOffX = 0;
SLVDE.Body.prototype.baseOffY = 0;

SLVDE.Body.prototype.omniDir = false;
SLVDE.Body.prototype.rotate = 0;

SLVDE.Body.prototype.lvl = undefined;
SLVDE.Body.prototype.team = "neutral";
SLVDE.Body.prototype.x = 0;
SLVDE.Body.prototype.setX = function(x) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dx = currentChild.x - this.x;
		currentChild.setX(x + dx);
	}
	this.x = x;
};
SLVDE.Body.prototype.y = 0;
SLVDE.Body.prototype.setY = function(y) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dy = currentChild.y - this.y;
		currentChild.setY(y + dy);
	}
	this.y = y;
};
SLVDE.Body.prototype.offX = 0;
SLVDE.Body.prototype.offY = 0;
SLVDE.Body.prototype.layer = 0;
SLVDE.Body.prototype.setLayer = function(layer) {
	for(var i = 0; i < this.children.length; i++)
	{
		var currentChild = this.children[i];
		var dLayer = currentChild.layer - this.layer;
		currentChild.setLayer(layer + dLayer);
	}
	this.layer = layer;
};
//SLVDE.Body.prototype.inAir = null;
//SLVDE.Body.prototype.mvmt = 1; //0 - still; 1 - random moving; 2 - back and forth; 4 - square
//SLVDE.Body.prototype.speech; //0/"" or message
// SLVDE.Body.prototype.dmnr = 1; //0 - peaceful; 1 - excitable; 2 - aggressive
SLVDE.Body.prototype.dir = 3;
// SLVDE.Body.prototype.steps = 0;// = 5;
// SLVDE.Body.prototype.wait = undefined;// = 0;

SLVDE.Body.prototype.act = [];
SLVDE.Body.prototype.pushAct = function(item) {
	if(this.act.length === 0) {
		this.act = [];
	}
	this.act.push(item);
};
SLVDE.Body.prototype.spliceAct = function(index, length) {
	this.act.splice(index, length);
	if(this.act.length <= 0)
	{
		delete this.act;
	}
};
SLVDE.Body.prototype.actSet = [];
SLVDE.Body.prototype.rcvr = 0;
SLVDE.Body.prototype.getAct = function(index) {
	return this.act[index];
};
SLVDE.Body.prototype.getActTime = function(index) {
	return this.act[index][1];
};
SLVDE.Body.prototype.getActOpt = function(index) {
	return this.actSet[index];
};
SLVDE.Body.prototype.getActOptProb = function(index) {
	return this.actSet[index].prob;
};
SLVDE.Body.prototype.handleAction = function() {
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
				if(SLVDE.process == "TRPG")
				{
					SLVDE.TRPGNextTurn(); //in TRPG.js
				}
			}
		}
	}
};
SLVDE.Body.prototype.pickAction = function() {
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
SLVDE.Body.prototype.requestAction = function(action) {
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
SLVDE.Body.prototype.seeAction = function() {
	for(var i = 0; i < this.act.length; i++)
	{
		this.act[i].see(this);
	}
};

SLVDE.Body.prototype.status = [];
SLVDE.Body.prototype.handleStatus = function() {
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
SLVDE.Body.prototype.seeStatus = function() {
	for(var i = 0; i < this.status.length; i++)
	{
		this.status[i].see(this);
	}
};

//SLVDE.Body.prototype.moveSet = [];

SLVDE.Body.prototype.keyFunc = {};
//Function run on ENTER or SPACE
SLVDE.Body.prototype.interact = function() {};

SLVDE.Body.prototype.pushy = true;

SLVDE.Body.prototype.frame = 0;

SLVDE.Body.prototype.stance = 0;
SLVDE.Body.prototype.defaultStance = function() {
	if(this.sprite) {
		this.sprite.requestStance("default");
		return;
	}

	if(!this.omniDir)
	{
		this.stance = SLVDE.determineColumn(this.dir);
	}
	else
	{
		this.stance = 0;
	}
};
SLVDE.Body.prototype.getStance = function() {
	return this.stance;
};
SLVDE.Body.prototype.requestStance = function(stance, forceReset) {
	if(this.sprite) {
		this.sprite.requestStance(stance, forceReset);
	}
	else {
		this.stance = stance;
	}
};
SLVDE.Body.prototype.resetStance = function() {
	delete this.stance;
};
SLVDE.Body.prototype.setBody = function(sprite) {
	this.sprite = sprite;
	this.sprite.offX = this.baseOffX;
	this.sprite.offY = this.baseOffY;
};

SLVDE.Body.prototype.hp = 100;
SLVDE.Body.prototype.strg = 5;
SLVDE.Body.prototype.spd = 2;

SLVDE.Body.prototype.path = [];
SLVDE.Body.prototype.addPointToPath = function(x, y) {
	if(this.path.x.length === 0)
	{
		this.path = [];
	}
	this.path.unshift({x: x, y: y});
};

SLVDE.Body.prototype.canAct = true;
//SLVDE.Body.prototype.canMove = true;
SLVDE.Body.prototype.canSeeAct = true;
//SLVDE.Body.prototype.canSeeMove = true;
SLVDE.Body.prototype.canSeeStatus = true;
SLVDE.Body.prototype.canSee = true;

SLVDE.Body.prototype.getHp = function() {
	return this.hp;
};
SLVDE.Body.prototype.getImage = function() {
	if(this.img)
	{
		if(!(this.img in SLVDE.image))
		{
			SLVDE.image[this.img] = new Image();
			SLVDE.image[this.img].src = "images/" + this.img.replace(/\"/g, "");
		}
		//this.img = SLVDE.image[this.img];
	}
	return SLVDE.image[this.img];
};
SLVDE.Body.prototype.getMaxHp = function() {
	return 100;
};
SLVDE.Body.prototype.getPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.layer = this.layer;
	return pos;
};
SLVDE.Body.prototype.getShownPosition = function() {
	var pos = {};
	pos.x = this.x;
	pos.y = this.y;
	pos.layer = this.layer;
	return pos;
};
SLVDE.Body.prototype.getShownX = function() {
	return this.x;
};
SLVDE.Body.prototype.getShownY = function() {
	return this.y;
};
SLVDE.Body.prototype.getSpeed = function() {
	return this.spd;
};
SLVDE.Body.prototype.getStrength = function() {
	return this.strg;
};
SLVDE.Body.prototype.getTeam = function() {
	return SLVDE.Teams[this.team];
};

SLVDE.Body.prototype.preventAction = function() { this.canAct = false; };
SLVDE.Body.prototype.preventActionSee = function() { this.canSeeAct = false; };
SLVDE.Body.prototype.preventStatusSee = function() { this.canSeeStatus = false; };
SLVDE.Body.prototype.preventRender = function() { this.canSee = false; };
SLVDE.Body.prototype.resetCans = function() { delete this.canSee; delete this.canAct; delete this.canSeeAct; delete this.canSeeStatus; };

SLVDE.Body.prototype.dart = {};

//Checks if the a SLVDE.Body's location is valid (based on current location and layer func data)
SLVDE.Body.prototype.canBeHere = function(allowInAir) {
	for(var ind = 0; ind < 8; ind++)
	{
		for(var sec = 0; sec < 16; sec++)
		{
			var i = SLVDE.pixCoordToIndex(person.x + sec, person.y + ind, SLVDE.currentLevel.layerFuncData[person.layer]);
			if(SLVDE.currentLevel.layerFuncData[person.layer].data[i] == 255)
			{
				if(allowInAir == 1 && SLVDE.currentLevel.layerFuncData[person.layer].data[i + 1] == 255) { }
				else return 0;
			}
		}
	}
	return 1;
};

SLVDE.Body.prototype.canSeePlayer = function() {
	var tDir = SLVDE.dirFromTo(this.x, this.y, SLVDE.player[SLVDE.currentPlayer].x, SLVDE.player[SLVDE.currentPlayer].y);
	return (Math.abs(tDir - this.dir) < 1 || Math.abs(tDir - this.dir) > 3);
};

SLVDE.Body.prototype.damage = function(amount) {
	this.hp -= amount;
};

//All of the "give" functions are intended to be passed a "new" object
SLVDE.Body.prototype.giveAction = function(action, keyFuncHandle) {
	if(this.actSet.length === 0)
	{
		this.actSet = [];
	}

	if((typeof action) == "string")
	{
		action = new SLVDE.Action[action]();
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
SLVDE.Body.prototype.giveStatus = function(status) {
	if(this.status.length === 0)
	{
		this.status = [];
	}

	if((typeof status) == "string")
	{
		status = new SLVDE.Status[status]();
	}

	this.status.push(status);
};

SLVDE.Body.prototype.hasStatus = function(status) {
	if((typeof status) == "string")
	{
		status = SLVDE.Status[status];
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
SLVDE.Body.prototype.pathMotion = function(spd) {
	var dist = Math.sqrt(Math.pow(this.x - this.path[0].x, 2) + Math.pow(this.y - this.path[0].y, 2));
	if(dist === 0)
	{
		this.path.shift();

		if(this == SLVDE.cTeam[SLVDE.currentPlayer] && this.path.length === 0)
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

//Based in time.js, this SLVDE.provides = function simple interface for setting a timed sequence of movement events for Bodys
// SLVDE.Body.prototype.registerWalkEvent = function(eventA, isDaily, day, hour, minute, second) {
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
// 	var cTime = SLVDE.Time.componentToAbsolute(day, hour, minute, second);
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
// 			var tDir = SLVDE.dirFromTo(cx, cy, nx, ny); //in functions.js
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
// 				event = new Function("var tNPC = SLVDE.getNPCByName(\"" + this.name + "\"); tNPC.walkPath(" + ptA.toString() + ");");
// 				SLVDE.Time.registerEvent(event, isDaily, cTime);
// 				ptA.length = 0;
// 				cTime = nTime + 8; //tack on a few extra frames to be safe
// 			}
//
// 			if(eventA[i] == "put")
// 			{
// 				event = new Function("var tNPC = SLVDE.getNPCByName(\"" + this.name + "\"); tNPC.x = " + eventA[i + 1] + "; tNPC.y = " + eventA[i + 2] + "; tNPC.layer = " + eventA[i + 3] + ";");
// 				SLVDE.Time.registerEvent(event, isDaily, cTime);
// 				i += 4;
//
// 				nx = eventA[i + 1];
// 				ny = eventA[i + 2];
// 			}
// 			else if(eventA[i] == "send")
// 			{
// 				event = new Function("var tNPC = SLVDE.getNPCByName(\"" + this.name + "\"); tNPC.lvl = " + eventA[i + 1] + "; tNPC.x = " + eventA[i + 2] + "; tNPC.y = " + eventA[i + 3] + "; tNPC.layer = " + eventA[i + 4] + ";");
// 				SLVDE.Time.registerEvent(event, isDaily, cTime);
// 				i += 5;
//
// 				nx = eventA[i + 2];
// 				ny = eventA[i + 3];
// 			}
// 			else if(eventA[i] == "function")
// 			{
// 				SLVDE.Time.registerEvent(eventA[i + 1], isDaily, cTime);
// 			}
// 		}
// 	}
// };

SLVDE.Body.prototype.say = function(message, overrideName) {
	SLVDE.personSays(this, message, overrideName);
};
SLVDE.Body.prototype.see = function(ctx) {
	if(!ctx)
	{
		ctx = SLVDE.see;
	}

	if(!this.canSee) return;

	var canvSeeX = this.x - SLVDE.wX - SLVDE.SCREENX/2 + this.offX - SLVDE.player[SLVDE.currentPlayer].offX;
	var canvSeeY = this.y - SLVDE.wY - SLVDE.SCREENY/2 + this.offY - SLVDE.player[SLVDE.currentPlayer].offY;

	if(canvSeeX < -SLVDE.SCREENX || canvSeeY < -SLVDE.SCREENY || canvSeeX > SLVDE.SCREENX || canvSeeY > SLVDE.SCREENY)
	{
		return;
	}

	// ctx.setTransform(1, 0, 0, 1, 0, 0);

	ctx.translate(this.x - SLVDE.wX + this.offX - SLVDE.player[SLVDE.currentPlayer].offX, this.y - SLVDE.wY + this.offY - SLVDE.player[SLVDE.currentPlayer].offY);

	ctx.rotate(this.rotate);

	//SLVDE.boardBody is displayed partially transparent depending on health (<= 50% transparent)
	//ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

	if(this.sprite) {
		this.sprite.draw(ctx);
	}
	else { //TODO: remove legacy code
		var col = this.getStance(); //in functions.js
		var tImg = this.getImage();
		var sx = this.xres*col;
		var sy = this.yres*this.frame;
		var pos = this.getShownPosition();
		var x = -Math.round(this.xres/2) - this.baseOffX;
		var y = -this.yres + Math.round(this.baseLength/2) - this.baseOffY;
		ctx.drawImage(tImg, sx, sy, this.xres, this.yres, x, y, this.xres, this.yres);
	}
	//ctx.globalAlpha = 1;

	this.seeAction();
	this.seeStatus();

	//ctx.rotate(-this.rotate);

	ctx.setTransform(1, 0, 0, 1, 0, 0);

	delete this.rotate;
};

SLVDE.Body.prototype.updateFrame = function() {
	if(this.sprite) return;

	//Only update on frame tick
	if(SLVDE.frameClock == 1)
	{
		this.frame++;
		if(this.getImage().height <= this.frame*this.yres)
		{
			this.frame = 0;
		}
	}
};

//(x1, y1, x2, y2, ...)
SLVDE.Body.prototype.walkPath = function() {
	if(SLVDE.currentLevel == this.level)
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
SLVDE.Body.prototype.zeldaBump = function(distance, direction) {
	//Save direction
	var tDir = this.dir;
	//Set direction
	this.dir = direction;
	//Bump
	this.zeldaStep(distance);
	//Revert direction;
	this.dir = tDir;
};
SLVDE.Body.prototype.zeldaCheckStep = function(axis, altAxis, isPositive) {
	var refinedNearbyBodies = [];

	var pixel, i;
	var coords = {};

	coords[axis] = isPositive ? this[axis] + Math.round(this.baseLength/2) - 1 : this[axis] - Math.round(this.baseLength/2);

	//Loop through width of base
	for(i = -this.baseLength/2; i < this.baseLength/2; i++)
	{
		coords[altAxis] = this[altAxis] + i;
		pixel = SLVDE.getPixel(coords.x, coords.y, SLVDE.currentLevel.layerFuncData[this.layer]);
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
			resumeFunc = SLVDE.currentLevel.boardProgram[pixel[2]];
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
			var distTrue = SLVDE.distanceTrue(this.x, this.y, currentAgent.x, currentAgent.y);
			if(distTrue < this.stepDistanceRemaining) {
				refinedNearbyBodies.push(currentAgent);
				if(distTrue < collisionDist)
				{
					var dDir = Math.abs(SLVDE.dirFromTo(this.x, this.y, currentAgent.x, currentAgent.y) - this.dir);
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
SLVDE.Body.prototype.zeldaLockOnPlayer = function() {
	this.zeldaLockOnPoint(SLVDE.player[SLVDE.currentPlayer].x, SLVDE.player[SLVDE.currentPlayer].y);
};
SLVDE.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
	this.dir = SLVDE.dirFromTo(this.x, this.y, qx, qy);
};
//*********Advances SLVDE.Body person up to distance distance as far as is legal. Includes pushing other Bodys out of the way? Returns -1 if stopped before distance?
SLVDE.Body.prototype.zeldaStep = function(distance) {
	var stopped = false;
	var stoppedTemp = false;
	var out = false;
	var ret = 1; //value to return at end
	var dy = -(Math.round(distance*Math.sin((this.dir)*(Math.PI/2)))); //Total y distance to travel
	var dx = Math.round(distance*Math.cos((this.dir)*(Math.PI/2))); //Total x distance to travel
	this.stepDistanceRemaining = dx + dy;
	this.nearbyBodies = SLVDE.boardAgent;
	var i, j, k;
	//Handle y movement
	for(i = 0; i < Math.abs(dy); i++)
	{
		this.y += (dy/Math.abs(dy));
		//Check if out of bounds
		if(this.y >= SLVDE.currentLevel.height || this.y < 0)
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
		if(this.x >= SLVDE.currentLevel.width || this.x < 0)
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
			j = SLVDE.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, SLVDE.currentLevel.layerFuncData[this.layer]);
			k = SLVDE.pixCoordToIndex(this.x + halfBase, this.y + halfBase, SLVDE.currentLevel.layerFuncData[this.layer]);
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.y -= 1; }
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.y += 1; }
		}
		if(dir > 0 && dir < 2) //case 1:
		{
			j = SLVDE.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, SLVDE.currentLevel.layerFuncData[this.layer]);
			k = SLVDE.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, SLVDE.currentLevel.layerFuncData[this.layer]);
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.x -= 1; }
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.x += 1; }
		}
		if(dir > 1 && dir < 3) //case 2:
		{
			j = SLVDE.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, SLVDE.currentLevel.layerFuncData[this.layer]);
			k = SLVDE.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, SLVDE.currentLevel.layerFuncData[this.layer]);
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.y -= 1; }
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.y += 1; }
		}
		if(dir > 2 && dir < 4) //case 3:
		{
			j = SLVDE.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, SLVDE.currentLevel.layerFuncData[this.layer]);
			k = SLVDE.pixCoordToIndex(this.x + halfBase, this.y + halfBase, SLVDE.currentLevel.layerFuncData[this.layer]);
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[j] != 255) { this.x -= 1; }
			if(SLVDE.currentLevel.layerFuncData[this.layer].data[k] != 255) { this.x += 1; }
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
