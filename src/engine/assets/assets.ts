import { CollageManager } from "../graphics/collage-manager";
import { Audio } from "./audio";
import { Images } from "./images";
import { CompiledGameData } from "./load";

export class Assets {
    public readonly audio: Audio;
    public readonly images: Images;
    public readonly collages: CollageManager;
    constructor(rootDir: string, public readonly gameData: CompiledGameData) {
        this.audio = new Audio(rootDir);
        this.images = new Images(rootDir);
        this.collages = new CollageManager(gameData);
    }
}
