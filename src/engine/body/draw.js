dependsOn("Body.js");

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

SplitTime.Body.prototype.getCanvasRequirements = function(layer) {
    // TODO: allow multiple layers and decimals
    if(layer != this.z) {
        return null;
    }
    return {
        // board location on this layer for center of canvas
        x: this.x,
        y: this.y,
        // TODO: smarter calculations
        width: this.xres * 4,
        height: this.yres * 4,
        isCleared: false
    };
};

SplitTime.Body.prototype.defaultStance = function() {
	this.requestStance("default", true);
};

SplitTime.Body.prototype.say = function(message, overrideName) {
	SplitTime.personSays(this, message, overrideName);
};
SplitTime.Body.prototype.see = function(ctx) {
	if(!ctx) {
		ctx = SplitTime.see;
	}

	if(!this.canSee) return;

	ctx.rotate(this.rotate);

	//SplitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
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
    // Potentially build in a blur between frames

    var tImg = this.getImage();
    var x = -Math.round(this.xres/2) - this.baseOffX;
    var y = -this.yres - this.baseOffY;
    ctx.drawImage(tImg, this.sx, this.sy, this.xres, this.yres, x, y, this.xres, this.yres);
};

SplitTime.Body.prototype.finalizeFrame = function() {
    if(this.stance != this.requestedStance || this.requestedFrameReset) {
        this.frame = 0;
    } else {
        //Only update on frame tick
        if(this.getRegion().hasSoMuchTimePassed(200)) {
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
	var dir = SplitTime.Direction.toString(this.dir);
	var simpleDir = SplitTime.Direction.simplifyToCardinal(dir);

    //Allow for non-complicated spritesheets with one column
    if(!this.stances) {
        return;
    }

    if(!this.requestedStance || !(this.requestedStance in this.stances)) {
        this.requestedStance = "default";
    }
    this.finalizeFrame();
    this.stance = this.requestedStance;

    var dirMap = this.stances[this.stance];

    if(!(dirMap instanceof Object)) {
        column = this.stances[this.stance];
    } else {
        //If shorten intermediate directions to cardinal if they are not specified
        if(dir in dirMap) {
            column = dirMap[dir];
        } else if(simpleDir in dirMap) {
            column = dirMap[simpleDir];
        } else {
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
    this.requestStance("default", false);
};

SplitTime.Body.prototype.prepareForRender = function() {
    this.finalizeStance();
    // TODO: do things like lights
};
SplitTime.Body.prototype.cleanupAfterRender = function() {
    this.resetStance();
};
