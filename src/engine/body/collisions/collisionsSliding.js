dependsOn("BodyMover.js");

/**
 *
 * @param {number} maxDistance
 */
SplitTime.Body.Mover.prototype.zeldaSlide = function(maxDistance) {
    if(this.bodyExt.sliding) {
        return;
    }

    this.bodyExt.sliding = true;

    var halfBase = Math.round(this.body.baseLength / 2);

    var x = Math.floor(this.body.getX());
    var y = Math.floor(this.body.getY());
    var z = Math.floor(this.body.getZ());

    var dist = maxDistance; //Math.min(1, maxDistance);

    // Closest diagonal direction positive angle from current direction
    var positiveDiagonal = (Math.round(this.body.dir + 1.1) - 0.5) % 4;
    // Closest diagonal direction negative angle from current direction
    var negativeDiagonal = (Math.round(this.body.dir + 3.9) - 0.5) % 4;

    var me = this;
    var levelTraces = this.body.getLevel().getLevelTraces();
    function isCornerOpen(direction, howFarAway) {
        var collisionInfo = new SplitTime.LevelTraces.CollisionInfo();
        var testX = x + SplitTime.Direction.getXSign(direction) * (halfBase + howFarAway);
        var testY = y + SplitTime.Direction.getYSign(direction) * (halfBase + howFarAway);
        levelTraces.calculatePixelColumnCollisionInfo(collisionInfo, testX, testY, me.body.z, me.body.z + me.body.height);
        return !collisionInfo.containsSolid;
    }

    for(var howFarOut = 1; howFarOut <= 5; howFarOut++) {
        var isCorner1Open = isCornerOpen(positiveDiagonal, howFarOut);
        var isCorner2Open = isCornerOpen(negativeDiagonal, howFarOut);
        if(isCorner1Open && !isCorner2Open) {
            this.zeldaBump(dist, positiveDiagonal);
            break;
        } else if(isCorner2Open && !isCorner1Open) {
            this.zeldaBump(dist, negativeDiagonal);
            break;
        }
    }

    this.bodyExt.sliding = false;
};

