SplitTime.Timeline = function() {
	this._timeInMilliseconds = 0;
    this._timeAdvanceListeners = new SLVD.RegisterCallbacks();
    /**
     * @type {SplitTime.Region[]}
     */
    this._regions = [];

    this._timelineSecondsPerRealSecond = 1;
};

var timeMap = {};
var defaultTime = new SplitTime.Timeline();

SplitTime.Timeline.get = function(timeId) {
    if(!timeMap[timeId]) {
        timeMap[timeId] = new SplitTime.Timeline(timeId);
    }
    return timeMap[timeId];
};

/**
 * Get the time object currently in play.
 * @returns {SplitTime.Timeline|null}
 */
SplitTime.Timeline.getCurrent = function() {
    var currentLevel = SplitTime.Level.getCurrent();
    if(currentLevel === null) {
        return null;
    }
    return currentLevel.getRegion().getTimeline();
};

SplitTime.Timeline.getDefault = function() {
    return defaultTime;
};

/**
 * @param {function(number)} listener
 */
SplitTime.Timeline.prototype.registerTimeAdvanceListener = function(listener) {
    this._timeAdvanceListeners.register(listener);
};

/**
 * @param {SplitTime.Region} region
 */
SplitTime.Timeline.prototype.addRegion = function(region) {
    this._regions.push(region);
};
/**
 * @param {SplitTime.Region} region
 */
SplitTime.Timeline.prototype.removeRegion = function(region) {
    var regionIndex = this._regions.indexOf(region);
    if(regionIndex >= 0) {
        this._regions.splice(regionIndex, 1);
    } else if(SplitTime.Debug.ENABLED) {
        SplitTime.Logger.warn("Attempted to remove region " + region.id + " from non-parent timeline");
    }
};

SplitTime.Timeline.componentToAbsolute = function(day, hour, minute, second) {
    return day * 60 * 60 * 24 + hour * 60 * 60 + minute * 60 + second;
};

SplitTime.Timeline.prototype.getTimeMs = function() {
    return this._timeInMilliseconds;
};

SplitTime.Timeline.prototype.advance = function(seconds) {
    this._timeInMilliseconds += Math.floor(seconds * 1000);
    this._timeAdvanceListeners.run(seconds);

    for(var i = 0; i < this._regions.length; i++) {
        this._regions[i].notifyTimeAdvance(seconds);
    }
};

SplitTime.Timeline.prototype.notifyFrameUpdate = function(delta) {
    this.advance(delta * this._timelineSecondsPerRealSecond);
};




SplitTime.Timeline.prototype.renderClock = function(context) {
    context.drawImage(SplitTime.Image.get("clock.png"), SplitTime.SCREENX - 140, 0);
    context.lineWidth = 1;
    context.strokeStyle = "#DDDDDD";
    var hand = Math.PI / 2 - (2 * (this.clockSeconds / 60) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
    context.lineWidth = 2;
    context.strokeStyle = "#000000";
    hand = Math.PI / 2 - (2 * (this.clockMinutes / 60) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
    context.strokeStyle = "#EE0000";
    context.lineWidth = 3;
    hand = Math.PI / 2 - (2 * (this.clockHours / 12) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
};


/**
 * @interface
 */
function TimeNotified() {}

/**
 * @param delta number of seconds passed (in game time) since last frame
 */
TimeNotified.prototype.notifyTimeAdvance = function(delta) {};
