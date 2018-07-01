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

SplitTime.Body.prototype.defaultStance = function() {
	this.requestStance("default", true);
};

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
	var dir = SplitTime.Direction.toString(this.dir);

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
            dir = SplitTime.Direction.toString(Math.round(this.dir) % 4);
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
