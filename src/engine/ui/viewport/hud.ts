namespace splitTime.ui {
    type RenderFunction = (view: View) => void
    export type Renderer = { render: RenderFunction }
    type AnyRenderer = RenderFunction | Renderer

    export class HUD {
        private renderCallbacks: AnyRenderer[] = []

        getRendererCount() {
            return this.renderCallbacks.length
        }

        pushRenderer(callback: AnyRenderer) {
            this.renderCallbacks.push(callback)
        }

        unshiftRenderer(callback: AnyRenderer) {
            this.renderCallbacks.unshift(callback)
        }

        removeRenderer(callback: AnyRenderer) {
            for (var i = this.renderCallbacks.length - 1; i >= 0; i--) {
                if (this.renderCallbacks[i] === callback) {
                    this.renderCallbacks.splice(i, 1)
                }
            }
        }

        render(view: View) {
            for (var i = 0; i < this.renderCallbacks.length; i++) {
                var renderer = this.renderCallbacks[i]
                if (typeof renderer === "function") {
                    renderer(view)
                } else if (typeof renderer.render === "function") {
                    renderer.render(view)
                }
            }
        }
    }
}
