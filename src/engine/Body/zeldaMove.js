dependsOn("Body.js");

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
	this.nearbyBodies = SplitTime.onBoard.agents;
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
