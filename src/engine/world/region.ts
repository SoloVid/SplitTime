import { Level, Timeline, game_seconds, World, Assets } from "../splitTime";
// A region is a logical unit of levels that are loaded together and share a common timeline
export class Region {
    private levels: Level[] = [];
    private _timeline: Timeline | null = null;
    constructor(public readonly id: string) { }
    getTimeline(): Timeline {
        if (!this._timeline) {
            throw new Error("Region " + this.id + " does not have a timeline set");
        }
        return this._timeline;
    }
    setTimeline(timeline: Timeline) {
        if (this._timeline) {
            this._timeline.removeRegion(this);
        }
        this._timeline = timeline;
        this._timeline.addRegion(this);
    }
    addLevel(level: Level) {
        this.levels.push(level);
        level.region = this;
    }
    getLevels(): Level[] {
        return this.levels;
    }
    notifyTimeAdvance(delta: game_seconds, absoluteTime: game_seconds) {
        for (var iLevel = 0; iLevel < this.levels.length; iLevel++) {
            this.levels[iLevel].notifyTimeAdvance(delta, absoluteTime);
        }
    }
    loadForPlay(world: World, assets: Assets): PromiseLike<void> {
        var promises = [];
        for (var i = 0; i < this.levels.length; i++) {
            promises.push(this.levels[i].loadForPlay(world, assets));
        }
        return Promise.all(promises).then();
    }
    unloadLevels(assets: Assets) {
        for (var i = 0; i < this.levels.length; i++) {
            this.levels[i].unload(assets);
        }
    }
}
