SplitTime.Position = function(level, x, y, z, dir, stance) {
    this.level = level;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dir = dir;
    this.stance = stance;
};

SplitTime.Position.prototype.getLevel = function() {
    return this.level;
};
