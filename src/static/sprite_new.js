SplitTime.Sprite = function(src, xres, yres, offX, offY) {
    this.src = src;
    this.xres = xres;
    this.yres = yres;

    if(offX && offY) {
        this.offX = offX;
        this.offY = offY;
    }
};

// SplitTime.Sprite.prototype.src;
SplitTime.Sprite.prototype.dir = "S";
SplitTime.Sprite.prototype.xres = 32;
SplitTime.Sprite.prototype.yres = 64;
SplitTime.Sprite.prototype.offX = 0;
SplitTime.Sprite.prototype.offY = 0;
SplitTime.Sprite.prototype.sx = 0;
SplitTime.Sprite.prototype.sy = 0;
SplitTime.Sprite.prototype.stance = "default";
SplitTime.Sprite.prototype.requestedStance = "default";
SplitTime.Sprite.prototype.requestedFrameReset = false;
SplitTime.Sprite.prototype.frame = 0;

SplitTime.Sprite.prototype.stances = {
    "default": {
        "S": 0,
        "N": 1,
        "E": 2,
        "W": 3,
    }
};


SplitTime.Sprite.prototype.draw = function(ctx) {
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

SplitTime.Sprite.prototype.finalizeFrame = function() {
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

SplitTime.Sprite.prototype.finalizeStance = function() {
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

SplitTime.Sprite.prototype.getImage = function() {
    return SplitTime.getImage(this.src);
};

SplitTime.Sprite.prototype.requestStance = function(stance, forceReset) {
    this.requestedStance = stance;
    this.requestedFrameReset = forceReset;
};

SplitTime.Sprite.prototype.setDirection = function(dir) {
    this.dir = dir;
};
