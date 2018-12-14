SplitTime.Region = function() {
    this.levels = [];
    this.time = new SplitTime.Time();
    this.TimeStabilizer = SplitTime.IntervalStabilizer.makeRegionStabilizerClass(this);
};

SplitTime.Region.prototype.getTime = function() {
    return this.time;
};
SplitTime.Region.prototype.getTimeMs = function() {
    return this.time.getTimeMs();
};

/**
 *
 * @param msPerStep
 * @param maxCounter
 * @return {Signaler}
 */
SplitTime.Region.prototype.getTimeStabilizer = function(msPerStep, maxCounter) {
    return new this.TimeStabilizer(msPerStep, maxCounter);
};
//This method may be dangerous for synchronization across skipped frames
// SplitTime.Region.prototype.hasSoMuchTimePassed = function(milliseconds) {
//     return this.TimeStabilizer.haveSoManyMsPassed(milliseconds);
// };

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

/**
 *
 * @param {SplitTime.Agent.Callback} callback
 */
SplitTime.Region.prototype.forEachAgent = function(callback) {
    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        this.levels[iLevel].forEachAgent(callback);
    }
};

(function() {
    var regionMap = {};
    var defaultRegion = new SplitTime.Region();

    SplitTime.Region.get = function(regionId) {
        if(!regionMap[regionId]) {
            regionMap[regionId] = new SplitTime.Region(regionId);
        }
        return regionMap[regionId];
    };

    /**
     * Get the region currently in play.
     * @returns {SplitTime.Region|null}
     */
    SplitTime.Region.getCurrent = function() {
        var currentLevel = SplitTime.Level.getCurrent();
        if(currentLevel === null) {
            return null;
        }
        return currentLevel.getRegion();
    };

    SplitTime.Region.getDefault = function() {
        return defaultRegion;
    };
} ());