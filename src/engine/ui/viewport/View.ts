namespace SplitTime.ui {
    export class View {
        public readonly seeB: HTMLCanvasElement;
        public readonly see: CanvasRenderingContext2D;

        constructor(public readonly width: int, public readonly height: int) {
            this.seeB = document.createElement("canvas");
            this.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
            this.seeB.setAttribute("id", "game-window");
            this.seeB.setAttribute("width", "" + width);
            this.seeB.setAttribute("height", "" + height);
            this.seeB.setAttribute("style", "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
            const tempSee = this.seeB.getContext("2d");
            if(tempSee === null) {
                throw new Error("Failed to initialize main see context");
            }
            this.see = tempSee;
        
            this.see.font="20px Arial";
            this.see.fillText("If this message persists for more than a few seconds,", 10, 30);
            this.see.fillText("this game will not run on your browser.", 10, 60);
        };

        /**
         * Attach view to DOM
         * @param {string} parentId ID of HTML element within which the game canvas will be placed.
         *                       If unspecified, parent element will be document.body
         * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
         */
        attach(parentId: string, additionalCanvasClass?: string) {
            var parent = document.body;
            if(parentId) {
                const foundParent = document.getElementById(parentId);
                if(!foundParent) {
                    throw new Error("Failed to find element \"" + parentId + "\" to attach game window");
                }
                parent = foundParent;
            }
            
            if(additionalCanvasClass) {
                this.seeB.setAttribute("class", additionalCanvasClass);
            }

            parent.appendChild(this.seeB);
        
            if(SplitTime.debug.ENABLED) {
                SplitTime.debug.attachDebug(parent);
            }
        }
    }
}