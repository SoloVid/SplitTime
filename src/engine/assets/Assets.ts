namespace SplitTime {
    const AUDIO_DIR = "audio";
    const IMAGE_DIR = "images";

    export class Assets {
        public readonly audio: assets.Audio;
        public readonly images: assets.Images;

        constructor(rootDir: string) {
            this.audio = new assets.Audio(rootDir + "/" + AUDIO_DIR);
            this.images = new assets.Images(rootDir + "/" + IMAGE_DIR);
        }
    }
}