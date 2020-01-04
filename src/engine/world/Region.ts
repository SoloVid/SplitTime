namespace SplitTime {
    
    var regionMap = {};
    
    // A region is a logical unit of levels that are loaded together and share a common timeline
    export class Region {
        id;
        levels: SplitTime.Level[];
        _timeline: SplitTime.Timeline;
        constructor(id) {
            this.id = id;
            this.levels = [];
            this._timeline = SplitTime.Timeline.getDefault();
            this._timeline.addRegion(this);
        };
        
        getTimeline() {
            return this._timeline;
        };
        getTimeMs() {
            return this._timeline.getTimeMs();
        };

        setTimeline(timeline) {
            this._timeline.removeRegion(this);
            this._timeline = timeline;
            this._timeline.addRegion(this);
        }
        
        /**
        *
        * @param msPerStep
        * @param maxCounter
        * @return {Signaler}
        */
        getTimeStabilizer(msPerStep?, maxCounter?) {
            var that = this;
            return new SplitTime.IntervalStabilizer(msPerStep, maxCounter, function() {
                return that.getTimeMs();
            });
        };
        
        addLevel(level) {
            this.levels.push(level);
            level.region = this;
        };
        
        static get(regionId) {
            if(!regionMap[regionId]) {
                regionMap[regionId] = new SplitTime.Region(regionId);
            }
            return regionMap[regionId];
        };
        
        /**
        * Get the region currently in play.
        */
        static getCurrent(): SplitTime.Region | null {
            var currentLevel = SplitTime.Level.getCurrent();
            if(currentLevel === null) {
                return null;
            }
            return currentLevel.getRegion();
        };
        
        static getDefault() {
            return defaultRegion;
        };
        
        notifyFrameUpdate(delta) {
            for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
                this.levels[iLevel].notifyFrameUpdate(delta);
            }
        };
        
        notifyTimeAdvance(delta) {
            for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
                this.levels[iLevel].notifyTimeAdvance(delta);
            }
        };
        
        loadForPlay() {
            var promises = new SLVD.PromiseCollection();
            for(var i = 0; i < this.levels.length; i++) {
                promises.add(this.levels[i].loadForPlay());
            }
            return promises;
        };
        
        unloadLevels() {
            for(var i = 0; i < this.levels.length; i++) {
                this.levels[i].unload();
            }
        };
    }
    var defaultRegion = new SplitTime.Region("!!!DEFAULT!!!");
}