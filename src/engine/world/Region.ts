namespace SplitTime {
    
    var regionMap = {};
    
    export class Region {
        levels: SplitTime.Level[];
        time: SplitTime.Time;
        mainTimeStabilizer: any;
        constructor() {
            this.levels = [];
            this.time = new SplitTime.Time();
            this.mainTimeStabilizer = this.getTimeStabilizer();
        };
        
        getTime() {
            return this.time;
        };
        getTimeMs() {
            return this.time.getTimeMs();
        };
        
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
                regionMap[regionId] = new SplitTime.Region();
            }
            return regionMap[regionId];
        };
        
        /**
        * Get the region currently in play.
        * @returns {SplitTime.Region|null}
        */
        static getCurrent() {
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
            this.time.advance(delta);
            
            for(var iLevel = 0; iLevel < this.levels.length; iLevel++) {
                this.levels[iLevel].notifyFrameUpdate(delta);
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
    var defaultRegion = new SplitTime.Region();
}