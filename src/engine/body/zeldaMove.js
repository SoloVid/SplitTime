dependsOn("Body.js");

//zeldaStep but with input direction
SplitTime.Body.prototype.zeldaBump = function(distance, direction) {
	//Prevent infinite recursion
	if(this.pushing || this.bumped) {
		return false;
	}
	this.bumped = true;

	//Save direction
	var tDir = this.dir;
	//Set direction
	this.dir = direction;
	//Bump
	var moved = this.zeldaStep(distance);
	//Revert direction;
	this.dir = tDir;

	this.bumped = false;
	return moved;
};
SplitTime.Body.prototype.zeldaCheckStep = function(axis, altAxis, isPositive) {
	return this.zeldaCheckStepTraces(axis, altAxis, isPositive) || this.zeldaCheckStepBodies();
};
SplitTime.Body.prototype.zeldaCheckStepTraces = function(axis, altAxis, isPositive) {
	var coords = {};
	var level = this.getLevel();

	coords[axis] = isPositive ? this[axis] + Math.round(this.baseLength/2) - 1 : this[axis] - Math.round(this.baseLength/2);

	var data = level.layerFuncData[this.z];

	//Loop through width of base
	for(var i = -this.baseLength/2; i < this.baseLength/2; i++)
	{
		coords[altAxis] = this[altAxis] + i;
		var dataIndex = SplitTime.pixCoordToIndex(coords.x, coords.y, data);
		var r = data.data[dataIndex++];
		var g = data.data[dataIndex++];
		var b = data.data[dataIndex++];
		var a = data.data[dataIndex++];
		if(r == 255)
		{
			if(this.inAir == 1 && g == 255) { }
			else //Otherwise, stop person
			{
				return true;
			}
		}
		else if(r == 100 && g === 0)
		{
			//Prepare function
			resumeFunc = level.boardProgram[b];
			resumeCue = resumeFunc(0);
		}
	}
};
SplitTime.Body.prototype.zeldaCheckStepBodies = function() {
	var refinedNearbyBodies = [];
	//Check for collision with people
	for(var i = 0; i < this.nearbyBodies.length; i++) {
		var currentAgent = this.nearbyBodies[i];
		if(this.team != currentAgent.team && currentAgent.baseLength > 0) {
			var collisionDist = (this.baseLength + currentAgent.baseLength)/2;
			var potentialCollisionDist = this.stepDistanceRemaining + collisionDist;
			var dx = Math.abs(this.x - currentAgent.x);
			var dy = Math.abs(this.y - currentAgent.y);
			if(dx < potentialCollisionDist && dy < potentialCollisionDist) {
				if(dx < collisionDist && dy < collisionDist) {
					var dDir = Math.abs(SplitTime.Direction.fromTo(this.x, this.y, currentAgent.x, currentAgent.y) - this.dir);
					if(dDir < 1 || dDir > 3) {
						//The .pushing here ensures that there is no infinite loop of pushing back and forth
						if(this.pushy && currentAgent.pushy && this.pushedBodies.indexOf(currentAgent) < 0) {
							this.pushing = true; //prevent counter-push
							var moved = currentAgent.zeldaBump(this.spd/2, this.dir);
							this.pushing = false;

							if(moved) {
								//Don't repush the same body
								this.pushedBodies.push(currentAgent);

								//Rerun this iteration of the loop
								i--;
								continue;
							}
						}
						//Hit a body we couldn't push
						return true;
					}
				}
				refinedNearbyBodies.push(currentAgent);
			}
		}
	}

	this.nearbyBodies = refinedNearbyBodies;
};
SplitTime.Body.prototype.zeldaLockOnPlayer = function() {
	this.zeldaLockOnPoint(SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y);
};
SplitTime.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
	this.dir = SplitTime.Direction.fromTo(this.x, this.y, qx, qy);
};

//*********Advances SplitTime.Body person up to distance distance as far as is legal. Includes pushing other Bodys out of the way? Returns -1 if stopped before distance?
SplitTime.Body.prototype.zeldaStep = function(distance) {
	var level = this.getLevel();
	var stopped = false;
	var stoppedTemp = false;
	var out = false;
	var ret = true; //value to return at end
	var dy = -(Math.round(distance*Math.sin((this.dir)*(Math.PI/2)))); //Total y distance to travel
	var ady = Math.abs(dy);
	var dx = Math.round(distance*Math.cos((this.dir)*(Math.PI/2))); //Total x distance to travel
	var adx = Math.abs(dx);
	var jhat = dy/ady;
	var ihat = dx/adx;
	this.stepDistanceRemaining = adx + ady;
	// TODO: put some logic for nearby agents in Level
	this.nearbyBodies = level.getAgents();
	this.pushedBodies = [];
	var i, j, k;
	//Handle y movement
	for(i = 0; i < ady; i++)
	{
		this.y += jhat;
		//Check if out of bounds
		if(this.y >= level.height || this.y < 0)
		{
			out = true;
		}
		else
		{
			stoppedTemp = this.zeldaCheckStep("y", "x", dy > 0);
		}

		if(stoppedTemp || out)
		{
			this.y -= jhat;
			break;
		}
		this.stepDistanceRemaining--;
	}
	stopped = stoppedTemp;
	//Handle x movement;
	for(i = 0; i < adx; i++) {
		this.x += ihat;
		if(this.x >= level.width || this.x < 0) {
			out = true;
		} else {
			stoppedTemp = this.zeldaCheckStep("x", "y", dx > 0);
		}

		if(stoppedTemp || out) {
			this.x -= ihat;
			break;
		}
		this.stepDistanceRemaining--;
	}
	stopped = stoppedTemp || stopped;
	var dir = this.dir;
	//If stopped, help person out by sliding around corner
	if(stopped && !out ) {
		ret = false;
		for(i = 0; i < 1; i++) {

		var halfBase = Math.round(this.baseLength/2);

		if(dir < 1 || dir > 3) //case 0:
		{
			j = SplitTime.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, level.layerFuncData[this.z]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y + halfBase, level.layerFuncData[this.z]);
			if(level.layerFuncData[this.z].data[j] != 255) { this.zeldaBump(1, 1); }
			if(level.layerFuncData[this.z].data[k] != 255) { this.zeldaBump(1, 3); }
		}
		if(dir > 0 && dir < 2) //case 1:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, level.layerFuncData[this.z]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y - halfBase - 1, level.layerFuncData[this.z]);
			if(level.layerFuncData[this.z].data[j] != 255) { this.zeldaBump(1, 2); }
			if(level.layerFuncData[this.z].data[k] != 255) { this.zeldaBump(1, 0); }
		}
		if(dir > 1 && dir < 3) //case 2:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y - halfBase - 1, level.layerFuncData[this.z]);
			k = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, level.layerFuncData[this.z]);
			if(level.layerFuncData[this.z].data[j] != 255) { this.zeldaBump(1, 1); }
			if(level.layerFuncData[this.z].data[k] != 255) { this.zeldaBump(1, 3); }
		}
		if(dir > 2 && dir < 4) //case 3:
		{
			j = SplitTime.pixCoordToIndex(this.x - halfBase - 1, this.y + halfBase, level.layerFuncData[this.z]);
			k = SplitTime.pixCoordToIndex(this.x + halfBase, this.y + halfBase, level.layerFuncData[this.z]);
			if(level.layerFuncData[this.z].data[j] != 255) { this.zeldaBump(1, 2); }
			if(level.layerFuncData[this.z].data[k] != 255) { this.zeldaBump(1, 0); }
		}
		}
	}
	else if(out == 1)
	{
		ret = false;
	}
	stopped = false;
	out = false;

	delete this.nearbyBodies;
	delete this.stepDistanceRemaining;

	return ret;
};
