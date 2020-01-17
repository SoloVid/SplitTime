namespace SplitTime {
    
    var regionMap: { [id: string]: Region } = {};
    
    // A region is a logical unit of levels that are loaded together and share a common timeline
    export class Region {
        levels: SplitTime.Level[];
        _timeline: SplitTime.Timeline;
        constructor(public readonly id: string) {
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

        setTimeline(timeline: Timeline) {
            this._timeline.removeRegion(this);
            this._timeline = timeline;
            this._timeline.addRegion(this);
        }
        
        getTimeStabilizer(msPerStep?: number, maxCounter?: number): Signaler {
            var that = this;
            return new SplitTime.IntervalStabilizer(msPerStep, maxCounter, function() {
                return that.getTimeMs();
            });
        };
        
        addLevel(level: Level) {
            this.levels.push(level);
            level.region = this;
        };
        
        static get(regionId: string) {
            if(!regionMap[regionId]) {
                regionMap[regionId] = new SplitTime.Region(regionId);
            }
            return regionMap[regionId];
        };
        
        /**
        * Get the region currently in play.
        */
        static getCurrent(): SplitTime.Region {
            var currentLevel = SplitTime.Level.getCurrent();
            return currentLevel.getRegion();
        };
        
        static getDefault() {
            return defaultRegion;
        };
        
        notifyFrameUpdate(delta: number) {
            for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
                this.levels[iLevel].notifyFrameUpdate(delta);
            }
        };
        
        notifyTimeAdvance(delta: number) {
            for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
                this.levels[iLevel].notifyTimeAdvance(delta);
            }
        };
        
        loadForPlay(): PromiseLike<any> {
            var promises = [];
            for(var i = 0; i < this.levels.length; i++) {
                promises.push(this.levels[i].loadForPlay());
            }
            return Promise.all(promises);
        };
        
        unloadLevels() {
            for(var i = 0; i < this.levels.length; i++) {
                this.levels[i].unload();
            }
        };
    }
    var defaultRegion = new SplitTime.Region("!!!DEFAULT!!!");
}