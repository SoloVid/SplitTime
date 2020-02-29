namespace splitTime {
    export const AUDIO_DIR = "audio"
    export const IMAGE_DIR = "images"

    export class Assets {
        public readonly audio: assets.Audio
        public readonly images: assets.Images

        constructor(rootDir: string) {
            this.audio = new assets.Audio(rootDir + "/" + AUDIO_DIR)
            this.images = new assets.Images(rootDir + "/" + IMAGE_DIR)
        }
    }
}

namespace G {
    // It is difficult to abstract assets away and still allow them to be useful
    // Avoid accessing this global when possible
    export var ASSETS: splitTime.Assets
}
