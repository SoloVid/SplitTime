namespace SplitTime.player {
    export class View {
        public readonly seeB: HTMLCanvasElement;
        public readonly see: CanvasRenderingContext2D;

        constructor(public readonly width: int, public readonly height: int, parent: HTMLElement, additionalCanvasClass: string) {
            this.seeB = document.createElement("canvas");
            this.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
            this.seeB.setAttribute("id", "game-window");
            this.seeB.setAttribute("width", "" + width);
            this.seeB.setAttribute("height", "" + height);
            this.seeB.setAttribute("style", "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
            if(additionalCanvasClass) {
                this.seeB.setAttribute("class", additionalCanvasClass);
            }
            parent.appendChild(this.seeB);
            const tempSee = this.seeB.getContext("2d");
            if(tempSee === null) {
                throw new Error("Failed to initialize main see context");
            }
            this.see = tempSee;
        
            this.see.font="20px Arial";
            this.see.fillText("If this message persists for more than a few seconds,", 10, 30);
            this.see.fillText("this game will not run on your browser.", 10, 60);
        
            // TODO: address other canvases
            // SplitTime.hud.createCanvases(width, height);
            // SplitTime.BoardRenderer.createCanvases(width, height);
            // SplitTime.WeatherRenderer.createCanvases(width, height);
        };
    }
}