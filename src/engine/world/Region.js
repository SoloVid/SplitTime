SplitTime.Region = function() {
    this.levels = [];
};

SplitTime.Region.prototype.addLevel = function(level) {
    this.levels.push(level);
};

// TODO: add optimization to get on-screen agents and off-screen agents separately
SplitTime.Region.prototype.getAgents = function() {
    var agents = [];
    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        agents.concat(this.levels[iLevel].getAgents());
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