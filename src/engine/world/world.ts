namespace splitTime {
    export class World {

        public readonly propPostProcessor = new world.PropPostProcessor()

        constructor(gameData: CompiledGameData = G._GAME_DATA) {
            const levelMap = gameData.levels
            for (const levelFilePath in levelMap) {
                const levelData = levelMap[levelFilePath]
                const levelId = levelFilePath.replace(/\.json$/, "")
                const level = new Level(levelId, levelData)
                this.levelMap[levelId] = level
            }
            for (const levelId in this.levelMap) {
                this.levelMap[levelId].readFileData(this)
            }
        }

        private readonly timeMap: { [id: string]: Timeline } = {}
        getTimeline(timeId: string): Timeline {
            if (!this.timeMap[timeId]) {
                this.timeMap[timeId] = new splitTime.Timeline(timeId)
            }
            return this.timeMap[timeId]
        }

        private readonly defaultTime = new splitTime.Timeline("__DEFAULT__")
        getDefaultTimeline(): splitTime.Timeline {
            return this.defaultTime
        }

        private readonly regionMap: { [id: string]: Region } = {}
        getRegion(regionId: string): Region {
            if (!this.regionMap[regionId]) {
                this.regionMap[regionId] = new splitTime.Region(regionId)
                this.regionMap[regionId].setTimeline(this.getDefaultTimeline())
            }
            return this.regionMap[regionId]
        }

        private readonly levelMap: { [id: string]: Level } = {}
        getLevel(levelId: string): Level {
            if (!this.levelMap[levelId]) {
                throw new Error("Level \"" + levelId + "\" not found")
            }
            return this.levelMap[levelId]
        }
    }
}
