dependsOn("Body.js");

SplitTime.Body.prototype.positions = {};
SplitTime.Body.prototype.positionCount = 0;

SplitTime.Body.prototype.getPosition = function(id) {
    if(id in this.positions) {
        return this.positions[id];
    }
    else {
        return this.getLevel().getPosition(id);
    }
};

SplitTime.Body.prototype.putInPosition = function(position) {
    if(!position) return;

    this.put(position.level, position.x, position.y, position.z);
    this.dir = position.dir;
    this.requestStance(position.stance);
};

SplitTime.Body.prototype.registerPosition = function(alias, position) {
    if(this.positionCount === 0) {
        this.positions = {};
    }
    this.positions[alias] = position;
};
