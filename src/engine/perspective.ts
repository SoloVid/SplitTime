import { World, LevelManager, Camera, WorldRenderer, Assets } from "./splitTime";
import { View } from "./ui/viewport/view";
import { HUD } from "./ui/viewport/hud";
import { Color } from "./light/color";
import * as splitTime from "./splitTime";
export class Perspective {
    public readonly levelManager: LevelManager;
    /**
     * If set, level transitions will be made automatically when this body changes levels.
     * Additionally, some sprites may fade out when this body goes behind them.
     */
    public playerBody: splitTime.Body | null = null;
    public readonly camera: Camera;
    public readonly worldRenderer: WorldRenderer;
    constructor(
        private readonly assets: Assets,
        public readonly world: World,
        public readonly view: View,
        public hud: HUD | null
    ) {
        this.world = world;
        this.levelManager = new LevelManager(this.world, assets);
        this.levelManager.onRegionExit((oldLevel, newLevel) => {
            return this.worldRenderer.fadeTo(new Color(255, 255, 255));
        });
        this.levelManager.onRegionEnter((oldLevel, newLevel) => {
            return this.worldRenderer.fadeIn();
        });
        this.view = view;
        this.camera = new Camera(this.view.width, this.view.height, () => this.levelManager.getCurrent());
        this.worldRenderer = new WorldRenderer({
            assets: assets,
            camera: this.camera,
            see: this.view.see,
            levelManager: this.levelManager,
            playerBodyGetter: () => this.playerBody,
        });
        this.hud = hud;
    }
}
