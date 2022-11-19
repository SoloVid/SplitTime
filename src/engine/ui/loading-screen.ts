import { View } from "./viewport/view";
export class LoadingScreen {
    constructor(private readonly view: View) { }
    show(percent?: number) {
        this.view.see.raw.context.fillStyle = "#000000";
        this.view.see.raw.context.fillRect(0, 0, this.view.width, this.view.height);
        this.view.see.raw.context.font = "30px Arial";
        this.view.see.raw.context.fillStyle = "#FFFFFF";
        let line = "Loading...";
        if (percent) {
            line = "Loading: " + percent + "%";
        }
        var x = this.view.width / 2 - this.view.see.raw.context.measureText(line).width / 2;
        this.view.see.raw.context.fillText(line, x, this.view.height / 2);
    }
}
