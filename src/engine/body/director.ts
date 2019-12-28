dependsOn("Body.js");

SplitTime.Body.prototype.zeldaLockOnPlayer = function() {
    var player = SplitTime.Player.getActiveBody();
    this.zeldaLockOnPoint(player.x, player.y);
};

/**
 * @param {number} qx
 * @param {number} qy
 */
SplitTime.Body.prototype.zeldaLockOnPoint = function(qx, qy) {
    this.dir = SplitTime.Direction.fromTo(this.x, this.y, qx, qy);
};
