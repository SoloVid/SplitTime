namespace SplitTime {
    export class World {
        private readonly timeMap: { [id: string]: Timeline } = {}
        getTimeline(timeId: string): Timeline {
            if (!this.timeMap[timeId]) {
                this.timeMap[timeId] = new SplitTime.Timeline(timeId)
            }
            return this.timeMap[timeId]
        }

        private readonly defaultTime = new SplitTime.Timeline("__DEFAULT__")
        getDefaultTimeline(): SplitTime.Timeline {
            return this.defaultTime
        }

        private readonly regionMap: { [id: string]: Region } = {}
        getRegion(regionId: string): Region {
            if (!this.regionMap[regionId]) {
                this.regionMap[regionId] = new SplitTime.Region(regionId)
                this.regionMap[regionId].setTimeline(this.getDefaultTimeline())
            }
            return this.regionMap[regionId]
        }

        private readonly levelMap: { [id: string]: Level } = {}
        getLevel(levelId: string): Level {
            if (!this.levelMap[levelId]) {
                this.levelMap[levelId] = new Level(levelId)
            }
            return this.levelMap[levelId]
        }
    }
}

namespace G {
    // This world object is a convenience for game code and should not be used in engine code
    export const WORLD: SplitTime.World = new SplitTime.World()
}
