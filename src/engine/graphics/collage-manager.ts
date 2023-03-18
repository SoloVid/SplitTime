import { CompiledGameData } from "engine/assets/load";
import { Collage, makeCollageFromFile } from "./collage";
export class CollageManager {
    private readonly collageMap: {
        [collageFilePath: string]: Collage;
    } = {};
    constructor(gameData: CompiledGameData) {
        for (const collageFilePath in gameData.collages) {
            const collageData = gameData.collages[collageFilePath];
            const collageId = collageFilePath.replace(/\.clg\.yml$/, "");
            this.collageMap[collageId] = makeCollageFromFile(collageData);
        }
    }
    get(collageId: string): Readonly<Collage> {
        if (!(collageId in this.collageMap)) {
            throw new Error("Collage " + collageId + " not found");
        }
        return this.collageMap[collageId];
    }
}
