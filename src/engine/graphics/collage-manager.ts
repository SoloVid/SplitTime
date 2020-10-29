namespace splitTime.collage {
    export class CollageManager {
        private readonly collageMap: { [collageFilePath: string]: splitTime.Collage } = {}

        constructor(gameData: CompiledGameData) {
            for (const collageFilePath in gameData.collages) {
                const collageData = gameData.collages[collageFilePath]
                const collageId = collageFilePath.replace(/\.json$/, "")
                this.collageMap[collageId] = makeCollageFromFile(collageData)
            }
        }

        get(collageId: string): Readonly<Collage> {
            if (!(collageId in this.collageMap)) {
                throw new Error("Collage " + collageId + " not found")
            }
            return this.collageMap[collageId]
        }
    }
}