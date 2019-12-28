SplitTime.Vector2D = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

SplitTime.Vector2D.angular = function(angle, magnitude) {
    return new SplitTime.Vector2D(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};