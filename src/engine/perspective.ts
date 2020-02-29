namespace splitTime {
    export class Perspective {
        public readonly world: World
        public readonly levelManager: LevelManager

        /**
         * If set, level transitions will be made automatically when this body changes levels.
         * Additionally, some sprites may fade out when this body goes behind them.
         */
        public playerBody: splitTime.Body | null = null

        public readonly view: ui.View
        public readonly camera: Camera
        public readonly worldRenderer: WorldRenderer

        public hud: ui.HUD | null

        constructor(world: World, view: ui.View, hud: ui.HUD | null) {
            this.world = world
            this.levelManager = new LevelManager(this.world)
            this.view = view
            this.camera = new Camera(this.view.width, this.view.height, () =>
                this.levelManager.getCurrent()
            )
            this.worldRenderer = new WorldRenderer(
                this.camera,
                this.view.see,
                () => this.levelManager.getCurrent(),
                () => this.playerBody
            )
            this.hud = hud
        }
    }
}
