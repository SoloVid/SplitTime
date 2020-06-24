namespace splitTime.ui {
    /**
     * This is the actual viewing window for the player to see the game.
     * Right now it is just a wrapper for a canvas, but it could
     * be changed a bit for other platforms.
     */
    export class View {
        public readonly seeB: splitTime.Canvas
        public readonly see: GenericCanvasRenderingContext2D

        constructor(public readonly width: int, public readonly height: int) {
            this.seeB = new splitTime.Canvas(width, height)
            if (this.seeB.element instanceof HTMLCanvasElement) {
                this.seeB.element.setAttribute("id", "game-window")
                this.seeB.element.setAttribute(
                    "style",
                    "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
                )
            }
            this.see = this.seeB.context

            this.see.font = "20px Arial"
            this.see.fillText(
                "If this message persists for more than a few seconds,",
                10,
                30
            )
            this.see.fillText("this game will not run on your browser.", 10, 60)
        }

        /**
         * Attach view to DOM
         * @param {string} parentId ID of HTML element within which the game canvas will be placed.
         *                       If unspecified, parent element will be document.body
         * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
         */
        attach(parentId: string, additionalCanvasClass?: string) {
            var parent = document.body
            if (parentId) {
                const foundParent = document.getElementById(parentId)
                if (!foundParent) {
                    throw new Error(
                        'Failed to find element "' +
                            parentId +
                            '" to attach game window'
                    )
                }
                parent = foundParent
            }

            assert(this.seeB.element instanceof HTMLCanvasElement, "View#attach requires an HTML canvas")
            if (additionalCanvasClass) {
                this.seeB.element.setAttribute("class", additionalCanvasClass)
            }

            parent.appendChild(this.seeB.element)

            if (splitTime.debug.ENABLED) {
                splitTime.debug.attachDebug(parent)
            }
        }
    }
}
