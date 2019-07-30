dependsOn("Body.js");

// TODO: separate this stuff from Body

SplitTime.Body.prototype.xres = 32;
SplitTime.Body.prototype.yres = 64;

SplitTime.Body.prototype.omniDir = false;
SplitTime.Body.prototype.rotate = 0;

SplitTime.Body.prototype.lightIntensity = 0;
SplitTime.Body.prototype.lightRadius = 150;
SplitTime.Body.prototype.sx = 0;
SplitTime.Body.prototype.sy = 0;
SplitTime.Body.prototype.stance = "default";
SplitTime.Body.prototype.requestedStance = "default";
SplitTime.Body.prototype.requestedFrameReset = false;
SplitTime.Body.prototype.frame = 0;

SplitTime.Body.prototype.playerOcclusionFadeFactor = 0;

SplitTime.Body.prototype.stances = {
    "default": {
        "S": 0,
        "N": 1,
        "E": 2,
        "W": 3,
    }
};

SplitTime.Body.prototype.getImage = function() {
    return SplitTime.Image.get(this.img);
};

/**
 * @return {{x: int, y: int, z: int, width: int, height: int, isCleared: boolean}}
 */
SplitTime.Body.prototype.getCanvasRequirements = function() {
    return {
        // board location on this layer for center of canvas
        x: Math.round(this.x),
        y: Math.round(this.y),
        z: Math.round(this.z),
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
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Body.prototype.see = function(ctx) {
	// if(!this.canSee) {return;}

	ctx.rotate(this.rotate);

	//SplitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
	//ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

	this.draw(ctx);

	this.seeAction();
	this.seeStatus();

	//ctx.rotate(-this.rotate);

	this.rotate = 0;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Body.prototype.draw = function(ctx) {
    // var
    //     // Radii of the white glow.
    //     innerRadius = 2,
    //     outerRadius = 16,
    //     // Radius of the entire circle.
    //     radius = 16;
    //
    // var gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
    // gradient.addColorStop(0, 'rgba(0, 0, 0, .7)');
    // gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    //
    // ctx.scale(1, 0.5);
    //
    // ctx.beginPath();
    // ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    //
    // ctx.fillStyle = gradient;
    // ctx.fill();
    //
    // ctx.scale(1, 2);
    // // ctx.restore();
    // // ctx.setTransform(1, 0, 0, 1, 0, 0);

    var tImg = this.getImage();

    var crop = this.getAnimationFrameCrop(this.dir, this.stance, this.frame);
    var x = -Math.round(crop.xres/2) - this.baseOffX;
    var y = -crop.yres - this.baseOffY;

    ctx.drawImage(tImg, crop.sx, crop.sy, crop.xres, crop.yres, x, y, crop.xres, crop.yres);

    if(SplitTime.Debug.ENABLED && SplitTime.Debug.DRAW_TRACES) {
        ctx.fillStyle = "#FF0000";
        var halfBaseLength = Math.round(this.baseLength / 2);
        ctx.fillRect(-halfBaseLength, -halfBaseLength, this.baseLength, this.baseLength);
    }
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

// TODO: abstract this?
SplitTime.Body.prototype.hasIdleAnimation = false;
SplitTime.Body.prototype.finalizeFrame = function() {
    if(isNaN(this.frame) || this.hasIdleAnimation && this.stance != this.requestedStance || this.requestedFrameReset) {
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
    var calculation = Math.floor(this.getImage().height / this.yres);
    if(isNaN(calculation)) {
        if(SplitTime.Debug.ENABLED) {
            console.warn(this.img + " not loaded yet for frame count calculation for " + this.ref);
        }
        return 1;
    } else {
        return calculation;
    }
};

SplitTime.Body.prototype.finalizeStance = function() {
    //Allow for non-complicated sprite sheets with one column
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
