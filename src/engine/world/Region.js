SplitTime.Region = function() {
    /**
     * @type {SplitTime.Level[]}
     */
    this.levels = [];
    this.time = new SplitTime.Time();
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
    var that = this;
    return new SplitTime.IntervalStabilizer(msPerStep, maxCounter, function() {
        return that.getTimeMs();
    });
};

SplitTime.Region.prototype.addLevel = function(level) {
    this.levels.push(level);
    level.region = this;
};

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

SplitTime.Region.prototype.notifyFrameUpdate = function(delta) {
    this.time.advance(delta);

    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        this.levels[iLevel].notifyFrameUpdate(delta);
    }
};

SplitTime.Region.prototype.loadForPlay = function() {
    var promises = new SLVD.Promise.Collection();
    for(var i = 0; i < this.levels.length; i++) {
        promises.add(this.levels[i].loadForPlay());
    }
    return promises;
};

SplitTime.Region.prototype.unloadLevels = function() {
    for(var i = 0; i < this.levels.length; i++) {
        this.levels[i].unload();
    }
};
