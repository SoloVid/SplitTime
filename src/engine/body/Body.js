var nextRef = 0;

SplitTime.Body = function() {
	this.ref = nextRef++;
	this.playerInteractHandlers = new SLVD.RegisterCallbacks(["onPlayerInteract"]);
	// TODO: sort out (throw out) inheritance to make this work right
	this.speechBox = new SplitTime.Body.SpeechBox(this, -42);
};
SplitTime.BodyTemplate = {};
SplitTime.BodyTemplate[""] = new SplitTime.Body(true);

SplitTime.Body.prototype.childrenBolted = [];
SplitTime.Body.prototype.childrenLoose = [];
SplitTime.Body.prototype.addChild = function(child, isBolted) {
	if(isBolted) {
		if(this.childrenBolted.length === 0) {
			this.childrenBolted = [];
		}
		this.childrenBolted.push(child);
	} else {
		if(this.childrenLoose.length === 0) {
            this.childrenLoose = [];
        }
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
/**
 * @deprecated should be moved to Prop class or something
 * @param traceStr
 * @param type
 */
SplitTime.Body.prototype.addStaticTrace = function(traceStr, type) {
	if(this.staticTrace.length === 0) {
        this.staticTrace = [];
    }
	this.staticTrace.push({traceStr: traceStr, type: type});
};

//The SplitTime.Body's base is the collision area of the SplitTime.Body
SplitTime.Body.prototype.baseLength = 16;
//Standard offset of the base is 0--that is, x=0 is centered and y=0 is at bottom
SplitTime.Body.prototype.baseOffX = 0;
SplitTime.Body.prototype.baseOffY = 0;

SplitTime.Body.prototype._resortInBodyOrganizer = function() {
	if(this._level) {
		this._level.getBodyOrganizer().resort(this);
	}
};

/**
 * @type {SplitTime.Level}
 * @private
 */
SplitTime.Body.prototype._level = null;
SplitTime.Body.prototype._x = 0;
SplitTime.Body.prototype.getX = function() {
	return this._x;
};
SplitTime.Body.prototype.setX = function(x, includeChildren) {
	if(includeChildren) {
        var children = this.getChildren();
        for(var i = 0; i < children.length; i++) {
            var currentChild = children[i];
            var dx = currentChild.getX() - this._x;
            currentChild.setX(x + dx, true);
        }
    }
	this._x = x;
	this._resortInBodyOrganizer();
};
SplitTime.Body.prototype._y = 0;
SplitTime.Body.prototype.getY = function() {
    return this._y;
};
SplitTime.Body.prototype.setY = function(y, includeChildren) {
	if(includeChildren) {
        var children = this.getChildren();
        for(var i = 0; i < children.length; i++) {
            var currentChild = children[i];
            var dy = currentChild.getY() - this._y;
            currentChild.setY(y + dy, true);
        }
    }
	this._y = y;
	this._resortInBodyOrganizer();
};
SplitTime.Body.prototype._z = 0;
SplitTime.Body.prototype.getZ = function() {
    return this._z;
};
SplitTime.Body.prototype.setZ = function(z, includeChildren) {
	if(includeChildren) {
        var children = this.getChildren();
        for(var i = 0; i < children.length; i++) {
            var currentChild = children[i];
            var dLayer = currentChild.getZ() - this._z;
            currentChild.setZ(z + dLayer, true);
        }
    }
	this._z = z;
	this._resortInBodyOrganizer();
};
SplitTime.Body.prototype.GRAVITY = -1280;
SplitTime.Body.prototype.zVelocity = 0;
SplitTime.Body.prototype.height = 32;

SplitTime.Body.prototype.dir = 3;

/**
 * @deprecated
 * @return {boolean}
 */
SplitTime.Body.prototype.isInCurrentLevel = function() {
    return this.getLevel() === SplitTime.Level.getCurrent();
};

SplitTime.Body.prototype.put = function(level, x, y, z) {
	this.setLevel(level);
	this.setX(x);
	this.setY(y);
	this.setZ(z);
};

/**
 * @param {string|SplitTime.Level} level
 * @param {boolean} [includeChildren]
 */
SplitTime.Body.prototype.setLevel = function(level, includeChildren) {
	if(typeof level === "string") {
		level = SplitTime.Level.get(level);
	}

	if(level === this._level) {
		return;
	}

	if(this._level) {
		this._level.removeBody(this);
	}

    this._level = level;
    this._level.insertBody(this);

    if(includeChildren) {
        var children = this.getChildren();
        for(var i = 0; i < children.length; i++) {
        	if(includeChildren) {
                children[i].setLevel(level, includeChildren);
            } else {
        		this.removeChild(children[i]);
			}
        }
    }

    this.timeStabilizer = level.getRegion().getTimeStabilizer(200);
};
/**
 * @return {SplitTime.Level}
 */
SplitTime.Body.prototype.getLevel = function() {
	return this._level;
};
/**
 * @deprecated perhaps too much clog
 * @return {SplitTime.Region}
 */
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

//Function run on ENTER or SPACE
SplitTime.Body.prototype.onPlayerInteract = function(handler) {
	if(handler) {
		this.playerInteractHandlers.register(handler);
	} else {
		this.playerInteractHandlers.run();
	}
};
