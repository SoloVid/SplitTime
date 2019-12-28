dependsOn("Body.js");

SplitTime.Body.prototype.canSeeBody = function(body) {
    var tDir = SplitTime.Direction.fromTo(this.x, this.y, body.x, body.y);
    return SplitTime.Direction.areWithin90Degrees(this.dir, tDir);
};

SplitTime.Body.prototype.canSeePlayer = function() {
    return this.canSeeBody(SplitTime.Player.getActiveBody());
};
