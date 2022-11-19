import { CollageManager } from "../graphics/collage-manager";
import { assets, CompiledGameData } from "../splitTime";
import { Images } from "./images";
export const AUDIO_DIR = "audio";
export const IMAGE_DIR = "images";
export const LEVEL_DIR = "levels";
export const COLLAGE_DIR = "collage";

export class Assets {
    public readonly audio: assets.Audio;
    public readonly images: Images;
    public readonly collages: CollageManager;
    constructor(rootDir: string, public readonly gameData: CompiledGameData) {
        this.audio = new assets.Audio(rootDir + "/" + AUDIO_DIR);
        this.images = new Images(rootDir + "/" + IMAGE_DIR);
        this.collages = new CollageManager(gameData);
    }
}
