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
	return this.zeldaCheckStepTraces(axis, altAxis, isPositive) && this.zeldaCheckStepBodies();
};
SplitTime.Body.prototype.zeldaCheckStepTraces = function(axis, altAxis, isPositive) {
	var coords = {};
	var level = this.getLevel();

	coords[axis] = Math.round(isPositive ? (this[axis] + this.baseLength/2) : (this[axis] - this.baseLength/2));

	var data = level.layerFuncData[this.z];

	//Loop through width of base
	for(var i = -this.baseLength/2; i < this.baseLength/2; i++) {
		coords[altAxis] = Math.round(this[altAxis] + i);
		var dataIndex = SplitTime.pixCoordToIndex(coords.x, coords.y, data);
		var r = data.data[dataIndex++];
		var g = data.data[dataIndex++];
		var b = data.data[dataIndex++];
		var a = data.data[dataIndex++];
		if(r === 255) {
			return false;
		} else if(a !== 0) {
			var colorId = r + "," + g + "," + b + "," + a;
			if(this._pixelsCrossed[colorId] === undefined) {
                try {
                    this._pixelsCrossed[colorId] = this.crossPixel(r, g, b, a) !== false;
				} catch(ex) {
                	console.error(ex);
				}
            }
            if(!this._pixelsCrossed[colorId]) {
                return false;
            }
        }
	}
	return true;
};
SplitTime.Body.prototype.zeldaCheckStepBodies = function() {
	// var refinedNearbyBodies = [];
	//Check for collision with people
	for(var i = 0; i < this.nearbyBodies.length; i++) {
		var body = this.nearbyBodies[i];
		if(this.team != body.team && body.baseLength > 0) {
			var collisionDist = (this.baseLength + body.baseLength)/2;
			// var potentialCollisionDist = this.stepDistanceRemaining + collisionDist;
			var dx = Math.abs(this.x - body.x);
			var dy = Math.abs(this.y - body.y);
			// if(dx < potentialCollisionDist && dy < potentialCollisionDist) {
				if(dx < collisionDist && dy < collisionDist) {
					var dirToOther = SplitTime.Direction.fromTo(this.x, this.y, body.x, body.y);
					if(SplitTime.Direction.areWithin90Degrees(this.dir, dirToOther)) {
						//The .pushing here ensures that there is no infinite loop of pushing back and forth
						if(this.pushy && body.pushy && this.pushedBodies.indexOf(body) < 0) {
							this.pushing = true; //prevent counter-push
							var moved = body.zeldaBump(this._totalStepDistance/2, this.dir);
							this.pushing = false;

							if(moved) {
								//Don't repush the same body
								this.pushedBodies.push(body);

								//Rerun this iteration of the loop
								i--;
								continue;
							}
						}
						//Hit a body we couldn't push
						return false;
					}
				}
				// refinedNearbyBodies.push(body);
			// }
		}
	}

	// this.nearbyBodies = refinedNearbyBodies;
	return true;
};
SplitTime.Body.prototype.zeldaLockOnPlayer = function() {
	var player = SplitTime.Player.getActiveBody();
	this.zeldaLockOnPoint(player.x, player.y);
};
SplitTime.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
	this.dir = SplitTime.Direction.fromTo(this.x, this.y, qx, qy);
};

//*********Advances SplitTime.Body person up to distance distance as far as is legal. Includes pushing other Bodys out of the way? Returns -1 if stopped before distance?
SplitTime.Body.prototype.zeldaStep = function(distance) {
	var level = this.getLevel();

	var dy = -distance*Math.sin((this.dir)*(Math.PI/2)); //Total y distance to travel
	var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy);
	var ady = Math.abs(dyRounded);

	var dx = distance*Math.cos((this.dir)*(Math.PI/2)); //Total x distance to travel
	var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx);
	var adx = Math.abs(dxRounded);

	var jhat = dyRounded/ady;
	var ihat = dxRounded/adx;

	this._totalStepDistance = distance;
	// this.stepDistanceRemaining = adx + ady;
	// TODO: put some logic for nearby agents in Level
    // this.nearbyBodies = level.getBodies();
    this.nearbyBodies = level.getBodiesWithin(this, this.baseLength / 2);
	this.pushedBodies = [];
	this._pixelsCrossed = {};

	// TODO: intertwine x and y pixel steps

	//Handle y movement
	var outY = false;
	var stoppedY = false;
    var pixelsMovedY = 0;
    for(var j = 0; j < ady; j++) {
		this.y += jhat;
		//Check if out of bounds
		if(this.y >= level.height || this.y < 0) {
            outY = true;
		} else {
            stoppedY = !this.zeldaCheckStep("y", "x", dy > 0);
		}

        // this.stepDistanceRemaining--;

		if(stoppedY || outY) {
			this.y -= jhat;
			break;
		} else {
			pixelsMovedY++;
		}
	}
	if(ady > 0 && !stoppedY && !outY) {
		// Subtract off any overshoot
		this.y -= (dyRounded - dy);
    } else if(pixelsMovedY === 1) {
        this.y -= 0.9*jhat;
    }

	//Handle x movement;
	var outX = false;
	var stoppedX = false;
	var pixelsMovedX = 0;
	for(var i = 0; i < adx; i++) {
		this.x += ihat;
		if(this.x >= level.width || this.x < 0) {
			outX = true;
		} else {
			stoppedX = !this.zeldaCheckStep("x", "y", dx > 0);
		}

        // this.stepDistanceRemaining--;

        if(stoppedX || outX) {
			this.x -= ihat;
			break;
		} else {
        	pixelsMovedX++;
		}
	}
    if(adx > 0 && !stoppedX && !outX) {
        // Subtract off any overshoot
        this.x -= (dxRounded - dx);
    } else if(pixelsMovedX === 1) {
		this.x -= 0.9*ihat;
	}

    this.nearbyBodies = null;
    this.pushedBodies = null;
    // this.stepDistanceRemaining = null;

    //If stopped, help person out by sliding around corner
    var stopped = stoppedX || stoppedY;
    var out = outX || outY;
	if(stopped && !out) {
		this.zeldaSlide(distance / 2);
	}

	return !(stopped || out);
};

SplitTime.Body.prototype.zeldaSlide = function(maxDistance) {
	if(this._sliding) {
		return;
	}

	this._sliding = true;

    var level = this.getLevel();
    var halfBase = Math.round(this.baseLength/2);
    var x = Math.round(this.x);
    var y = Math.round(this.y);
    var z = Math.round(this.z);

    var dist = maxDistance; //Math.min(1, maxDistance);

    // for(var i = 0; i < 1; i++) {

	// Closest diagonal direction positive angle from current direction
    var positiveDiagonal = (Math.round(this.dir + 1.1) - 0.5) % 4;
    // Closest diagonal direction negative angle from current direction
    var negativeDiagonal = (Math.round(this.dir + 3.9) - 0.5) % 4;

    var iPositiveCorner = SplitTime.pixCoordToIndex(
        x + SplitTime.Direction.getXSign(positiveDiagonal) * (halfBase + 1),
        y + SplitTime.Direction.getYSign(positiveDiagonal) * (halfBase + 1),
        level.layerFuncData[z]
    );
    var iNegativeCorner = SplitTime.pixCoordToIndex(
        x + SplitTime.Direction.getXSign(negativeDiagonal) * (halfBase + 1),
        y + SplitTime.Direction.getYSign(negativeDiagonal) * (halfBase + 1),
        level.layerFuncData[z]
    );

    var isPositiveCornerOpen = level.layerFuncData[z].data[iPositiveCorner] !== 255;
    var isNegativeCornerOpen = level.layerFuncData[z].data[iNegativeCorner] !== 255;

    // if(SplitTime.FrameStabilizer.haveSoManyMsPassed(200)) {
    //     console.log("positive: " + positiveDiagonal + " (" + isPositiveCornerOpen + "), negative: " + negativeDiagonal + " (" + isNegativeCornerOpen + ")");
    // }

    if(isPositiveCornerOpen && isNegativeCornerOpen) {
    	// Tie; do nothing
	} else if(isPositiveCornerOpen) {
    	this.zeldaBump(dist, positiveDiagonal);
	} else if(isNegativeCornerOpen) {
    	this.zeldaBump(dist, negativeDiagonal);
	}
    // }

	this._sliding = false;
};
