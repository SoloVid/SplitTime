import { JoyStick } from "../controls/joy-stick";
import { Button } from "../controls/button";
export class MenuControls {
    constructor(readonly joyStick: JoyStick, readonly confirmButton: Button, readonly cancelButton: Button) { }
}
