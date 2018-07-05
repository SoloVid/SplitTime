dependsOn("Agent.js");

SplitTime.Agent.Path = function(body, speed, stance) {
    this.body = body;
    this.speed = speed || body.spd;
    this.stance = stance || "walk";
    this.schedule = [];
};

SplitTime.Agent.Path.prototype.isIdle = function() {
    return this.schedule.length === 0;
};

SplitTime.Agent.Path.prototype.walkTo = function(xOrPoint, y) {
    var point = xOrPoint;
    if(typeof xOrPoint === "number" && typeof y === "number") {
        point = {x: xOrPoint, y: y};
    }

    var promise = new SLVD.Promise();
    this.schedule.push({
        point: point,
        promise: promise
    });

    return promise;
};

//(x1, y1, x2, y2, ...)
SplitTime.Agent.Path.prototype.walkPath = function() {
    if(this.body.getLevel() === SplitTime.Level.getCurrent()) {
        var lastPromise;
        var i = 0;
        while(i < arguments.length) {
            if(typeof arguments[i] === "number" && typeof arguments[i + 1] === "number") {
                lastPromise = this.walkTo(arguments[i], arguments[i + 1]);
                i += 2;
            } else {
                lastPromise = this.walkTo(arguments[i]);
                i++;
            }
        }
        return lastPromise;
    } else {
        this.body.setX(arguments[arguments.length - 2]);
        this.body.setY(arguments[arguments.length - 1]);
        return SLVD.Promise.as();
    }
};

SplitTime.Agent.Path.prototype.fastForward = function() {
    if(this.schedule.length > 0) {
        var event = this.schedule[this.schedule.length - 1];
        this.body.setX(event.point.x);
        this.body.setY(event.point.y);
        this.schedule.length = 0;
        event.promise.resolve();
    }
};

SplitTime.Agent.Path.prototype.notifyFrameUpdate = function() {
    if(this.schedule.length > 0) //Handle path motion
    {
        this.body.requestStance(this.stance);

        this.pathMotion(this.body.spd);
    } else {
        //Set stance to default based on direction
        this.body.defaultStance();

        this.body.handleStatus();
        this.body.handleAction();
    }
};

SplitTime.Agent.Path.prototype.pathMotion = function() {
    var event = this.schedule[0];
    var point = event.point;
    var dist = Math.sqrt(Math.pow(this.body.x - point.x, 2) + Math.pow(this.body.y - point.y, 2));
    if(dist < 1) {
        this.schedule.shift();
        event.promise.resolve();
    } else {
        this.body.zeldaLockOnPoint(point.x, point.y);
        var jump;
        var frameSpeed = this.body.getPixelSpeedForFrame(this.speed);
        // if(Math.round(dist) < spd) { jump = Math.round(dist); }
        if(dist < frameSpeed) { jump = dist; }
        else { jump = frameSpeed; }
        this.body.y -= jump*Math.sin((this.body.dir)*(Math.PI/2));
        this.body.x += jump*Math.cos((this.body.dir)*(Math.PI/2));
    }
};
