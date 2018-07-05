SplitTime.Region = function() {
    this.levels = [];
    this.time = new SplitTime.Time();
    this.TimeStabilizer = SplitTime.IntervalStabilizer.makeRegionStabilizerClass(this);
};

SplitTime.Region.prototype.getTime = function() {
    return this.time;
};
SplitTime.Region.prototype.getTimeStabilizer = function(msPerStep, maxCounter) {
    return new this.TimeStabilizer(msPerStep, maxCounter);
};
SplitTime.Region.prototype.hasSoMuchTimePassed = function(milliseconds) {
    return this.TimeStabilizer.haveSoManyMsPassed(milliseconds);
};

SplitTime.Region.prototype.addLevel = function(level) {
    this.levels.push(level);
    level.region = this;
};

// TODO: add optimization to get on-screen agents and off-screen agents separately
SplitTime.Region.prototype.getAgents = function() {
    var agents = [];
    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        agents = agents.concat(this.levels[iLevel].getAgents());
    }
    return agents;
};

(function() {
    var regionMap = {};

    SplitTime.Region.get = function(regionId) {
        if(!regionMap[regionId]) {
            regionMap[regionId] = new SplitTime.Region(regionId);
        }
        return regionMap[regionId];
    };

    SplitTime.Region.getCurrent = function() {
        var currentLevel = SplitTime.Level.getCurrent();
        if(currentLevel === null) {
            return null;
        }
        return currentLevel.getRegion();
    };
} ());