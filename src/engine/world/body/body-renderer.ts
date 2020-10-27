namespace splitTime.body {
    export class Renderer {
        private readonly graph = new BodyRenderingGraph()
        private _nodes: (BodyNode | null)[] = []
        private _nodeByGraphRef: { [ref: number]: number } = {}
        private screen: { x: number; y: number } | null = null
        private ctx: GenericCanvasRenderingContext2D | null = null

        constructor(private readonly camera: Camera) {}

        notifyNewFrame(
            screen: { x: number; y: number },
            ctx: GenericCanvasRenderingContext2D
        ) {
            this.screen = screen
            this.ctx = ctx
            this.graph.notifyNewFrame()
        }

        /**
         * receives a body that needs to be rendered (called by BoardRenderer)
         */
        feedBody(body: splitTime.Body, isPlayer: boolean): void {
            if (body.drawables.length === 0) {
                return
            }

            if (this.isBodyOnScreen(body)) {
                const graphNode = this.graph.feedBody(body)
                const node = this._getBodyNode(graphNode, body)
                node.isPlayer = isPlayer

                //Fade in/out for level transitions
                if (body.fadeEnteringLevelPromise) {
                    // FTODO: This feels a little disingenuous to resolve
                    // here because the fade hasn't actually finished
                    body.fadeEnteringLevelPromise.resolve()
                    body.fadeEnteringLevelPromise = null;
                    if (!isPlayer) {
                        node.opacity = 0
                        node.targetOpacity = 1
                    }
                }
            }
        }

        private _getBodyNode(graphNode: GraphBodyNode, body?: splitTime.Body): BodyNode {
            // If the node is in the map, return it.
            if (graphNode.ref in this._nodeByGraphRef) {
                const node = this._nodes[this._nodeByGraphRef[graphNode.ref]]
                if (node) {
                    if (node.graphNode == graphNode) {
                        return node
                    }
                }
            }

            assert(!!body, "Body needs to be provided when creating a new node")
            // Otherwise, if the body is unaccounted or misplaced, set up a new node
            var node = new BodyNode(body, graphNode)
            for (var i = 0; i <= this._nodes.length; i++) {
                if (!this._nodes[i]) {
                    this._nodes[i] = node
                    this._nodeByGraphRef[graphNode.ref] = i
                    return node
                }
            }
            throw new Error(
                "Failed to find a suitable place in body rendering array for " +
                    graphNode.ref
            )
        }

        render() {
            this.graph.rebuildGraph()
            this.graph.walk(graphNode => {
                const node = this._getBodyNode(graphNode)
                for (const graphNodeBehind of graphNode.before) {
                    const nodeBehind = this._getBodyNode(graphNodeBehind)
                    this._fadeOccludingSprite(node, nodeBehind)
                }
                this.drawBodyTo(node)
            })
        }

        private isBodyOnScreen(body: Body): boolean {
            //optimization for not drawing if out of bounds
            var screen = this.camera.getScreenCoordinates()
            var screenBottom = screen.y + this.camera.SCREEN_HEIGHT
            var screenRightEdge = screen.x + this.camera.SCREEN_WIDTH

            for (const drawable of body.drawables) {
                const drawArea = drawable.getCanvasRequirements().rect
                //If the body is in bounds
                if (
                    drawArea.y2 >= screen.y &&
                    drawArea.x2 >= screen.x &&
                    drawArea.y <= screenBottom &&
                    drawArea.x <= screenRightEdge
                ) {
                    return true
                }
            }
            return false
        }

        /**
         * @param overlappingPixels - the number of pixels by which the two are overlapping
         */
        private _fadeOccludingSprite(
            nodeInFront: BodyNode,
            nodeBehind: BodyNode
        ): void {
            // If it isn't the active player behind, we don't need to fade any here
            if (!nodeBehind.isPlayer) {
                return
            }

            const drawArea = nodeInFront.graphNode.drawArea
            const otherDrawArea = nodeBehind.graphNode.drawArea
            if (!drawArea || !otherDrawArea) {
                return
            }

            const yDiffVal1 = drawArea.y2 - otherDrawArea.y
            const yDiffVal2 = otherDrawArea.y2 - drawArea.y
            const xDiffVal1 = otherDrawArea.x2 - drawArea.x
            const xDiffVal2 = drawArea.x2 - otherDrawArea.x
            const overlappingPixels = Math.min(
                xDiffVal1,
                xDiffVal2,
                yDiffVal1,
                yDiffVal2
            )

            for (const drawable of nodeInFront.body.drawables) {
                //If this sprite has the "playerOcclusionFadeFactor" property set to a value greater than zero, fade it out when player is behind
                if (drawable.playerOcclusionFadeFactor > 0.01) {
                    var CROSS_FADE_PIXELS = 32

                    if (splitTime.debug.ENABLED) {
                        if (
                            drawable.playerOcclusionFadeFactor <
                                0 ||
                            drawable.playerOcclusionFadeFactor > 1
                        ) {
                            log.error(
                                "Sprite specified with playerOcclusionFadeFactor invalid value: " +
                                    drawable.playerOcclusionFadeFactor
                            )
                            return
                        }
                    }

                    //If the body is not already in a level transition
                    if(!nodeInFront.body.fadeEnteringLevelPromise){
                        //Fade gradually based on the number of overlapping pixels
                        var crossFadeFactor = Math.min(
                            overlappingPixels / CROSS_FADE_PIXELS,
                            1
                        )
                        var pixelsFactor =
                            crossFadeFactor *
                            drawable.playerOcclusionFadeFactor
                        // TODO: Only apply this to single drawable
                        nodeInFront.targetOpacity = 1 - pixelsFactor
                    }
                }
            }
        }

        drawBodyTo(node: BodyNode) {
            for (const drawable of node.body.drawables) {
                this.drawBodyDrawable(node, drawable)
            }
        }

        private drawBodyDrawable(node: BodyNode, drawable: Drawable): void {
            //FTODO: revisit
            if (!this.ctx || !this.screen) {
                return
            }
            // TODO: potentially give the body a cleared personal canvas if requested

            // Translate origin to body location
            const translateOriginTarget = drawable.getDesiredOrigin(node.graphNode.body)
            this.ctx.translate(
                Math.round(translateOriginTarget.x - this.screen.x),
                Math.round(translateOriginTarget.y - translateOriginTarget.z - this.screen.y)
            )

            //Set the opacity for this body, but ease toward it
            node.opacity = splitTime.approachValue(
                node.opacity,
                node.targetOpacity,
                0.05
            )
            this.ctx.globalAlpha = node.opacity

            //Draw the body
            drawable.draw(this.ctx)

            //Reset opacity settings back to default (1 - "not opaque")
            this.ctx.globalAlpha = 1
            node.targetOpacity = 1

            // Reset transform
            this.ctx.setTransform(1, 0, 0, 1, 0, 0)
        }
    }

    class BodyNode {
        isPlayer: boolean = false
        opacity: number = 1
        targetOpacity: number = 1
        constructor(
            readonly body: Body,
            readonly graphNode: GraphBodyNode
        ) {}
    }
}
