namespace SplitTime.menu {
    export class MenuMan {
        constructor(
            private readonly view: ui.View,
            private readonly controls: MenuControls,
            private readonly hud: ui.HUD
        ) {}

        create(spec: MenuSpec): Menu {
            return new Menu(spec, this.view, this.controls, this.hud)
        }
    }
}
