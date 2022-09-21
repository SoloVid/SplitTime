import { World, LevelManager, Camera, WorldRenderer } from "./splitTime";
import { View } from "./ui/viewport/view";
import { HUD } from "./ui/viewport/hud";
import { Color } from "./light/color";
import * as splitTime from "./splitTime";
export class Perspective {
    public readonly world: World;
    public readonly levelManager: LevelManager;
    /**
     * If set, level transitions will be made automatically when this body changes levels.
     * Additionally, some sprites may fade out when this body goes behind them.
     */
    public playerBody: splitTime.Body | null = null;
    public readonly view: View;
    public readonly camera: Camera;
    public readonly worldRenderer: WorldRenderer;
    public hud: HUD | null;
    constructor(world: World, view: View, hud: HUD | null) {
        this.world = world;
        this.levelManager = new LevelManager(this.world);
        this.levelManager.onRegionExit((oldLevel, newLevel) => {
            return this.worldRenderer.fadeTo(new Color(255, 255, 255));
        });
        this.levelManager.onRegionEnter((oldLevel, newLevel) => {
            return this.worldRenderer.fadeIn();
        });
        this.view = view;
        this.camera = new Camera(this.view.width, this.view.height, () => this.levelManager.getCurrent());
        this.worldRenderer = new WorldRenderer(this.camera, this.view.see, this.levelManager, () => this.playerBody);
        this.hud = hud;
    }
}
