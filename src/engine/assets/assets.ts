namespace splitTime {
    export const AUDIO_DIR = "audio"
    export const IMAGE_DIR = "images"
    export const LEVEL_DIR = "levels"
    export const COLLAGE_DIR = "collage"

    export class Assets {
        public readonly audio: assets.Audio
        public readonly images: assets.Images
        public readonly collages: splitTime.collage.CollageManager

        constructor(rootDir: string, gameData: CompiledGameData) {
            this.audio = new assets.Audio(rootDir + "/" + AUDIO_DIR)
            this.images = new assets.Images(rootDir + "/" + IMAGE_DIR)
            this.collages = new collage.CollageManager(gameData)
        }
    }
}

namespace G {
    // It is difficult to abstract assets away and still allow them to be useful
    // Avoid accessing this global when possible
    export var ASSETS: splitTime.Assets
}
