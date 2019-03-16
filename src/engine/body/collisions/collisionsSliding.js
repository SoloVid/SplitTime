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
    function isCornerOpen(direction, howFarAway) {
        var open = true;
        me.level.forEachRelevantTraceDataLayer(me.body, function(data) {
            var iCorner = SplitTime.pixCoordToIndex(
                x + SplitTime.Direction.getXSign(direction) * (halfBase + howFarAway),
                y + SplitTime.Direction.getYSign(direction) * (halfBase + howFarAway),
                data
            );

            if(data.data[iCorner] === SplitTime.Trace.RColor.SOLID) {
                open = false;
                return true;
            }
        });
        return open;
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

