import { CompiledGameData } from "engine/assets/load";
import { getErrorPlaceholderImageUrl } from "engine/assets/placeholder-image";
import { error } from "engine/utils/logger";
import { Collage, makeCollage, makeCollageFromFile } from "./collage";
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
            error("Collage " + collageId + " not found");
            return collageMissingPlaceholder
        }
        return this.collageMap[collageId];
    }
}

const collageMissingPlaceholder = makeCollage(
    getErrorPlaceholderImageUrl("collage missing"),
    [],
    "",
    { allowErrors: true, suppressErrors: true, },
)
