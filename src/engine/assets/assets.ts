import { assets, CompiledGameData } from "../splitTime";
import { Images } from "./images";
import { CollageManager } from "../graphics/collage-manager";
import * as splitTime from "../splitTime";
export const AUDIO_DIR = "audio";
export const IMAGE_DIR = "images";
export const LEVEL_DIR = "levels";
export const COLLAGE_DIR = "collage";
export class Assets {
    public readonly audio: assets.Audio;
    public readonly images: Images;
    public readonly collages: CollageManager;
    constructor(rootDir: string, gameData: CompiledGameData) {
        this.audio = new assets.Audio(rootDir + "/" + AUDIO_DIR);
        this.images = new Images(rootDir + "/" + IMAGE_DIR);
        this.collages = new CollageManager(gameData);
    }
}
// It is difficult to abstract assets away and still allow them to be useful
// Avoid accessing this global when possible
export var ASSETS: splitTime.Assets;
