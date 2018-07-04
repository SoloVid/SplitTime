dependsOn("Body.js");

SplitTime.Agent.Path = function(body) {
    this.body = body;
};

SplitTime.Agent.Path.prototype.path = [];
SplitTime.Agent.Path.prototype.addPointToPath = function(x, y) {
    if(this.path.length === 0) {
        this.path = [];
    }
    this.path.unshift({x: x, y: y});
};

//(x1, y1, x2, y2, ...)
SplitTime.Agent.Path.prototype.walkPath = function() {
    if(SplitTime.currentLevel == this.level) {
        var spd = this.spd;
        for(var i = 0; i < arguments.length; i += 2)
        {
            this.addPointToPath(arguments[i], arguments[i + 1]);
        }
    } else {
        this.body.setX(arguments[arguments.length - 2]);
        this.body.setY(arguments[arguments.length - 1]);
    }
};

SplitTime.Agent.Path.prototype.fastForward = function() {
    if(this.path.length > 0) {
        this.body.setX(this.path[this.path.length - 1].x);
        this.body.setY(this.path[this.path.length - 1].y);
    }
};

SplitTime.Agent.Path.prototype.notifyFrameUpdate = function() {
    if(this.path.length > 0) //Handle path motion
    {
        this.body.requestStance("walk");

        this.pathMotion(this.body.spd);
    } else {
        //Set stance to default based on direction
        this.body.defaultStance();

        this.body.handleStatus();
        this.body.handleAction();
    }
};

//Move a person along their set path at given speed.
SplitTime.Agent.Path.prototype.pathMotion = function(spd) {
    var dist = Math.sqrt(Math.pow(this.body.x - this.path[0].x, 2) + Math.pow(this.body.y - this.path[0].y, 2));
    if(dist === 0) {
        this.path.shift();
    } else {
        this.body.zeldaLockOnPoint(this.path[0].x, this.path[0].y);
        var jump;
        // if(Math.round(dist) < spd) { jump = Math.round(dist); }
        if(dist < spd) { jump = dist; }
        else { jump = spd; }
        this.body.y -= jump*Math.sin((this.body.dir)*(Math.PI/2));
        this.body.x += jump*Math.cos((this.body.dir)*(Math.PI/2));
    }
};
