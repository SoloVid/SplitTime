namespace SplitTime {
    export class LoadingScreen {
        constructor(private readonly view: ui.View) {

        }

        show(percent?: number) {
            this.view.see.fillStyle = "#000000";
            this.view.see.fillRect(0, 0, this.view.width, this.view.height);
            this.view.see.font = "30px Arial";
            this.view.see.fillStyle = "#FFFFFF";
            let line = "Loading...";
            if(percent) {
                line = "Loading: " + percent + "%";
            }
			var x = this.view.width / 2 - this.view.see.measureText(line).width / 2;
			this.view.see.fillText(line, x, this.view.height / 2);
        };
    }
}
