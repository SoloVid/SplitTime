dependsOn("Body.js");

SplitTime.Body.prototype.lightIntensity = 0;
SplitTime.Body.prototype.lightRadius = 150;
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

/**
 * @return {{x: number, y: number, width: number, height: number, isCleared: boolean}}
 */
SplitTime.Body.prototype.getCanvasRequirements = function() {
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

/**
 * Draw a segment (split vertically) of the body onto the canvas context
 * @param {CanvasRenderingContext2D} ctx
 * @param {int} minZ minimum z value for segment of Body that should be drawn
 * @param {int} exMaxZ maximum (exclusive) z value for the segment of the Body that should be drawn
 */
SplitTime.Body.prototype.see = function(ctx, minZ, exMaxZ) {
	if(!this.canSee) {return;}

	ctx.rotate(this.rotate);

	//SplitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
	//ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

	this.draw(ctx, minZ, exMaxZ);

	this.seeAction();
	this.seeStatus();

	//ctx.rotate(-this.rotate);

	this.rotate = 0;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {int} minZ minimum z value for segment of Body that should be drawn
 * @param {int} exMaxZ maximum (exclusive) z value for the segment of the Body that should be drawn
 */
SplitTime.Body.prototype.draw = function(ctx, minZ, exMaxZ) {
    var tImg = this.getImage();

    var crop = this.getAnimationFrameCrop(this.dir, this.stance, this.frame);
    var x = -Math.round(crop.xres/2) - this.baseOffX;
    var y = -crop.yres - this.baseOffY;

    ctx.drawImage(tImg, crop.sx, crop.sy, crop.xres, crop.yres, x, y, crop.xres, crop.yres);
};

SplitTime.Body.prototype.getAnimationFrameCrop = function(numDir, stance, frame) {
    var crop = {
        xres: this.xres,
        yres: this.yres,
        sx: 0,
        sy: this.yres*frame
    };

    var column = 0;
    var dir = SplitTime.Direction.toString(numDir);
    var simpleDir = SplitTime.Direction.simplifyToCardinal(dir);

    //Allow for non-complicated spritesheets with one column
    if(!this.stances) {
        return crop;
    }

    if(!stance || !(stance in this.stances)) {
        stance = "default";
    }

    var dirMap = this.stances[stance];
    if(!(dirMap instanceof Object)) {
        column = this.stances[stance];
    } else {
        //If shorten intermediate directions to cardinal if they are not specified
        if(dir in dirMap) {
            column = dirMap[dir];
        } else if(simpleDir in dirMap) {
            column = dirMap[simpleDir];
        } else {
            console.warn("Stance " + stance + " missing direction " + dir);
            column = 0;
        }
    }

    crop.sx = this.xres*column;
    return crop;
};

SplitTime.Body.prototype.getVerticalSegmentCrop = function(dimensions, minZ, exMaxZ) {
    if(minZ > this.z + this.height || exMaxZ < this.z) {
        return null;
    }

};

// TODO: abstract this?
SplitTime.Body.prototype.hasIdleAnimation = false;
SplitTime.Body.prototype.finalizeFrame = function() {
    if(this.hasIdleAnimation && this.stance != this.requestedStance || this.requestedFrameReset) {
        this.frame = 0;
    } else {
        //TODO: don't rely on global time passing since we might skip frames at some point
        //i.e. ^^ instantiate a Stabilizer rather than using static method
        //Only update on frame tick
        if(this.timeStabilizer.isSignaling()) {
            this.frame++;
            this.frame %= this.getAnimationFramesAvailable();
        }
    }
};

SplitTime.Body.prototype.getAnimationFramesAvailable = function() {
    return Math.floor(this.getImage().height / this.yres);
};

SplitTime.Body.prototype.finalizeStance = function() {
    //Allow for non-complicated spritesheets with one column
    if(!this.stances) {
        return;
    }

    if(!this.requestedStance || !(this.requestedStance in this.stances)) {
        this.requestedStance = "default";
    }
    this.stance = this.requestedStance;
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
    this.finalizeFrame();
    // TODO: do things like lights
};
SplitTime.Body.prototype.cleanupAfterRender = function() {
    this.resetStance();
};
