// A region is a logical unit of levels that are loaded together and share a common timeline
SplitTime.Region = function(id) {
    this.id = id;
    /**
     * @type {SplitTime.Level[]}
     */
    this.levels = [];
    this._timeline = SplitTime.Timeline.getDefault();
    this._timeline.addRegion(this);
};

SplitTime.Region.prototype.getTimeline = function() {
    return this._timeline;
};
SplitTime.Region.prototype.getTimeMs = function() {
    return this._timeline.getTimeMs();
};

SplitTime.Region.prototype.setTimeline = function(timeline) {
    this._timeline.removeRegion(this);
    this._timeline = timeline;
    this._timeline.addRegion(this);
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
    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        this.levels[iLevel].notifyFrameUpdate(delta);
    }
};

SplitTime.Region.prototype.notifyTimeAdvance = function(delta) {
    for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
        this.levels[iLevel].notifyTimeAdvance(delta);
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
