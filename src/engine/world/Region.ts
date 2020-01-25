namespace SplitTime {
    // A region is a logical unit of levels that are loaded together and share a common timeline
    export class Region {
        private levels: SplitTime.Level[] = [];
        private _timeline: SplitTime.Timeline | null = null;
        constructor(public readonly id: string) {
        };
        
        getTimeline(): Timeline {
            if(!this._timeline) {
                throw new Error("Region " + this.id + " does not have a timeline set");
            }
            return this._timeline;
        };
        getTimeMs(): number {
            return this.getTimeline().getTimeMs();
        };

        setTimeline(timeline: Timeline) {
            if(this._timeline) {
                this._timeline.removeRegion(this);
            }
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
        
        loadForPlay(world: World): PromiseLike<any> {
            var promises = [];
            for(var i = 0; i < this.levels.length; i++) {
                promises.push(this.levels[i].loadForPlay(world));
            }
            return Promise.all(promises);
        };
        
        unloadLevels() {
            for(var i = 0; i < this.levels.length; i++) {
                this.levels[i].unload();
            }
        };
    }
}