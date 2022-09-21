import { View } from "../viewport/view";
import { MenuControls } from "./menu-controls";
import { HUD } from "../viewport/hud";
import { MenuSpec } from "./menu-spec";
import { Menu } from "./menu";
export class MenuMan {
    constructor(private readonly view: View, private readonly controls: MenuControls, private readonly hud: HUD) { }
    create(spec: MenuSpec): Menu {
        return new Menu(spec, this.view, this.controls, this.hud);
    }
}
