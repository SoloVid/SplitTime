SplitTime.NewSprte = function(src, xres, yres, offX, offY) {
    this.src = src;
    this.xres = xres;
    this.yres = yres;

    if(offX && offY) {
        this.offX = offX;
        this.offY = offY;
    }
};

// SplitTime.NewSprte.prototype.src;
SplitTime.NewSprte.prototype.dir = "S";
SplitTime.NewSprte.prototype.xres = 32;
SplitTime.NewSprte.prototype.yres = 64;
SplitTime.NewSprte.prototype.offX = 0;
SplitTime.NewSprte.prototype.offY = 0;
SplitTime.NewSprte.prototype.sx = 0;
SplitTime.NewSprte.prototype.sy = 0;
SplitTime.NewSprte.prototype.stance = "default";
SplitTime.NewSprte.prototype.requestedStance = "default";
SplitTime.NewSprte.prototype.requestedFrameReset = false;
SplitTime.NewSprte.prototype.frame = 0;

SplitTime.NewSprte.prototype.stances = {
    "default": {
        "S": 0,
        "N": 1,
        "E": 2,
        "W": 3,
    }
};


SplitTime.NewSprte.prototype.draw = function(ctx) {
    if(!ctx)
    {
        ctx = SplitTime.see;
    }

    this.finalizeStance();

    var tImg = this.getImage();
    var x = -Math.round(this.xres/2) - this.offX;
    var y = -this.yres - this.offY;
    ctx.drawImage(tImg, this.sx, this.sy, this.xres, this.yres, x, y, this.xres, this.yres);
};

SplitTime.NewSprte.prototype.finalizeFrame = function() {
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

SplitTime.NewSprte.prototype.finalizeStance = function() {
    //Allow for non-complicated spritesheets with one column
    if(!this.stances) {
        this.column = 0;
        return;
    }


    if(!this.requestedStance || !(this.requestedStance in this.stances)) {
        this.requestedStance = "default";
    }
    this.finalizeFrame();
    this.stance = this.requestedStance;

    if(!(this.stances[this.stance] instanceof Object)) {
        this.column = this.stances[this.stance];
    }
    else {
        //If shorten intermediate directions to cardinal if they are not specified
        if(!(this.dir in this.stances[this.stance])) {
            this.dir = this.dir.charAt(0);
        }

        if(this.dir in this.stances[this.stance]) {
            this.column = this.stances[this.stance][this.dir];
        }
        else {
            console.warn("Stance " + this.stance + " missing direction " + this.dir);
            this.column = 0;
        }
    }

    this.sx = this.xres*this.column;
    this.sy = this.yres*this.frame;
};

SplitTime.NewSprte.prototype.getImage = function() {
    return SplitTime.getImage(this.src);
};

SplitTime.NewSprte.prototype.requestStance = function(stance, forceReset) {
    this.requestedStance = stance;
    this.requestedFrameReset = forceReset;
};

SplitTime.NewSprte.prototype.setDirection = function(dir) {
    this.dir = dir;
};
