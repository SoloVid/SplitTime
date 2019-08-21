dependsOn("../Body.js");
dependsOn("/Direction.js");

/**
 * @param img
 * @constructor
 * @implements {SplitTime.Body.Drawable}
 */
SplitTime.Sprite = function(img) {
    this.img = img;
    this._timeMs = 0;
    var that = this;
    /**
     * @type {Signaler}
     * @private
     */
    this._frameSignaler = new SplitTime.IntervalStabilizer(200, 1, function() {
        return that._timeMs;
    });
};

SplitTime.Sprite.DEFAULT_STANCE = "default";

SplitTime.Sprite.prototype.xres = 32;
SplitTime.Sprite.prototype.yres = 64;

SplitTime.Sprite.prototype.baseOffX = 0;
SplitTime.Sprite.prototype.baseOffY = 0;

SplitTime.Sprite.prototype.omniDir = false;
SplitTime.Sprite.prototype.rotate = 0;

SplitTime.Sprite.prototype.playerOcclusionFadeFactor = 0;
SplitTime.Sprite.prototype.stance = SplitTime.Sprite.DEFAULT_STANCE;
SplitTime.Sprite.prototype.requestedStance = SplitTime.Sprite.DEFAULT_STANCE;
SplitTime.Sprite.prototype.requestedFrameReset = false;
SplitTime.Sprite.prototype.frame = 0;
SplitTime.Sprite.prototype.dir = SplitTime.Direction.S;
SplitTime.Sprite.prototype.requestedDir = SplitTime.Direction.S;

SplitTime.Sprite.prototype.stances = {
    "default": {
        "S": 0,
        "N": 1,
        "E": 2,
        "W": 3,
    }
};

SplitTime.Sprite.prototype.getImage = function() {
    return SplitTime.Image.get(this.img);
};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {{x: int, y: int, z: int, width: number, height: number, isCleared: boolean}}
 */
SplitTime.Sprite.prototype.getCanvasRequirements = function(x, y, z) {
    return {
        // 2D board location for center of canvas
        x: Math.round(x),
        y: Math.round(y),
        z: Math.round(z),
        // TODO: smarter calculations
        width: this.xres,// * 4,
        height: this.yres,// * 4,
        isCleared: false
    };
};

SplitTime.Sprite.prototype.defaultStance = function() {
	this.requestStance(SplitTime.Sprite.DEFAULT_STANCE, this.dir, true);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Sprite.prototype.draw = function(ctx) {
	// if(!this.canSee) {return;}

	ctx.rotate(this.rotate);

	//SplitTime.onBoard.bodies is displayed partially transparent depending on health (<= 50% transparent)
	//ctx.globalAlpha = (this.hp + this.strg)/(2*this.strg);

	this._drawSimple(ctx);

	// this.seeAction();
	// this.seeStatus();

	//ctx.rotate(-this.rotate);

	this.rotate = 0;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Sprite.prototype._drawSimple = function(ctx) {
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
};

SplitTime.Sprite.prototype.getAnimationFrameCrop = function(numDir, stance, frame) {
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
SplitTime.Sprite.prototype.hasIdleAnimation = false;
SplitTime.Sprite.prototype.finalizeFrame = function() {
    if(isNaN(this.frame) || this.hasIdleAnimation && this.stance != this.requestedStance || this.requestedFrameReset) {
        this.frame = 0;
    } else {
        //TODO: don't rely on global time passing since we might skip frames at some point
        //i.e. ^^ instantiate a Stabilizer rather than using static method
        //Only update on frame tick
        if(this._frameSignaler.isSignaling()) {
            var mod = this.getAnimationFramesAvailable();
            if(!isNaN(mod) && mod > 0) {
                this.frame++;
                this.frame %= mod;
            }
        }
    }
};

SplitTime.Sprite.prototype.getAnimationFramesAvailable = function() {
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

SplitTime.Sprite.prototype.finalizeStance = function() {
    //Allow for non-complicated sprite sheets with one column
    if(!this.stances) {
        return;
    }

    if(!this.requestedStance || !(this.requestedStance in this.stances)) {
        this.requestedStance = "default";
    }
    this.stance = this.requestedStance;
    this.dir = this.requestedDir;
};

SplitTime.Sprite.prototype.requestStance = function(stance, dir, forceReset) {
    this.requestedStance = stance;
    this.requestedDir = dir;
    this.requestedFrameReset = forceReset;
};

SplitTime.Sprite.prototype.resetStance = function() {
    this.requestStance(SplitTime.Sprite.DEFAULT_STANCE, this.dir, false);
};

SplitTime.Sprite.prototype.notifyFrameUpdate = function(delta) {
    this._timeMs += delta * 1000;
};

SplitTime.Sprite.prototype.prepareForRender = function() {
    this.finalizeStance();
    this.finalizeFrame();
    // TODO: do things like lights
};
SplitTime.Sprite.prototype.cleanupAfterRender = function() {
    this.resetStance();
};
