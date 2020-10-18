namespace splitTime.body {
    export class Renderer {
        _nodes: (BodyNode | null)[]
        _bodyToNodeIndexMap: { [ref: number]: number }
        screen: { x: number; y: number } | null
        ctx: GenericCanvasRenderingContext2D | null

        constructor(private readonly camera: Camera) {
            this._nodes = []
            this._bodyToNodeIndexMap = {}

            this.screen = null
            this.ctx = null
        }

        notifyNewFrame(
            screen: { x: number; y: number },
            ctx: GenericCanvasRenderingContext2D
        ) {
            this.screen = screen
            this.ctx = ctx
            for (var i = 0; i < this._nodes.length; i++) {
                var node = this._nodes[i]
                if (node) {
                    // This will be set back to true soon if appropriate
                    node.shouldBeDrawnThisFrame = false
                    node.visitedThisFrame = false
                    node.overlappingWithPlayer = false
                }
            }
        }

        /**
         * receives a body that needs to be rendered (called by BoardRenderer)
         */
        feedBody(body: splitTime.Body, isPlayer: boolean) {
            if (body.drawables.length === 0) {
                return
            }
            const drawArea = math.Rect.make(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0, 0)
            for (const drawable of body.drawables) {
                const singleDrawArea = drawable.getCanvasRequirements().rect
                singleDrawArea.x += body.x
                //Combine y and z axes to get the "screen y" position,
                // which is the y location on the 2D screen
                singleDrawArea.y += body.y - body.z
                drawArea.x = Math.min(drawArea.x, singleDrawArea.x)
                drawArea.x2 = Math.max(drawArea.x2, singleDrawArea.x2)
                drawArea.y = Math.min(drawArea.y, singleDrawArea.y)
                drawArea.y2 = Math.max(drawArea.y2, singleDrawArea.y2)
            }
            var node = this._getBodyNode(body)
            node.drawables = body.drawables
            node.drawArea = drawArea
            node.shouldBeDrawnThisFrame = true
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

        private _getBodyNode(body: splitTime.Body): BodyNode {
            // If the node is in the map, return it.
            if (body.ref in this._bodyToNodeIndexMap) {
                const node = this._nodes[this._bodyToNodeIndexMap[body.ref]]
                if (node) {
                    if (node.body == body) {
                        return node
                    }
                }
            }

            // Otherwise, if the body is unaccounted or misplaced, set up a new node
            var node = new BodyNode(body)
            for (var i = 0; i <= this._nodes.length; i++) {
                if (!this._nodes[i]) {
                    this._nodes[i] = node
                    this._bodyToNodeIndexMap[body.ref] = i
                    return node
                }
            }
            throw new Error(
                "Failed to find a suitable place in body rendering array for " +
                    body.ref
            )
        }

        render() {
            this._removeDeadBodies()
            this._rebuildGraph()
            for (var i = 0; i < this._nodes.length; i++) {
                var node = this._nodes[i]
                if (node) {
                    this._visitNode(node)
                }
            }
        }

        private _visitNode(node: BodyNode) {
            if (node.visitedThisFrame) {
                return
            }
            node.visitedThisFrame = true

            for (var i = 0; i < node.before.length; i++) {
                this._visitNode(node.before[i])
            }

            this.drawBodyTo(node)
        }

        private _removeDeadBodies() {
            for (var i = 0; i < this._nodes.length; i++) {
                var node = this._nodes[i]
                if (node) {
                    if (!node.shouldBeDrawnThisFrame) {
                        this._nodes[i] = null
                    } else {
                        node.before = []
                    }
                }
            }
        }

        private _rebuildGraph() {
            var nodesOnScreen = this._getNodesOnScreen()
            //For each node
            for (var i = 0; i < nodesOnScreen.length; i++) {
                const node = nodesOnScreen[i]
                const drawArea = node.drawArea
                //FTODO: revisit
                if (!drawArea) {
                    continue
                }

                //For each other node we haven't visited yet
                for (var h = i + 1; h < nodesOnScreen.length; h++) {
                    const otherNode = nodesOnScreen[h]
                    const otherDrawArea = otherNode.drawArea
                    //FTODO: revisit
                    if (!otherDrawArea) {
                        continue
                    }

                    const yDiffVal1 = drawArea.y2 - otherDrawArea.y
                    const yDiffVal2 = otherDrawArea.y2 - drawArea.y

                    //Skip if the two bodies don't overlap on the screen's y axis (top to bottom)
                    if (yDiffVal1 > 0 && yDiffVal2 > 0) {
                        const xDiffVal1 = otherDrawArea.x2 - drawArea.x
                        const xDiffVal2 = drawArea.x2 - otherDrawArea.x

                        //Skip if the two bodies don't overlap on the x axis (left to right)
                        if (xDiffVal1 > 0 && xDiffVal2 > 0) {
                            const bottomDiff = Math.abs(
                                otherDrawArea.y2 - drawArea.y2
                            )
                            const overlappingPixels = Math.min(
                                xDiffVal1,
                                xDiffVal2,
                                yDiffVal1,
                                bottomDiff
                            )
                            this._constructEdge(
                                node,
                                otherNode,
                                overlappingPixels
                            )
                        }
                    }
                }
            }
        }

        private _getNodesOnScreen() {
            var nodesOnScreen = []
            //For each node
            for (var i = 0; i < this._nodes.length; i++) {
                var node = this._nodes[i]
                if (node) {
                    const drawArea = node.drawArea
                    //FTODO: revisit
                    if (!drawArea) {
                        continue
                    }

                    //optimization for not drawing if out of bounds
                    var screen = this.camera.getScreenCoordinates()
                    var screenBottom = screen.y + this.camera.SCREEN_HEIGHT
                    var screenRightEdge = screen.x + this.camera.SCREEN_WIDTH

                    //If the body is in bounds
                    if (
                        drawArea.y2 >= screen.y &&
                        drawArea.x2 >= screen.x &&
                        drawArea.y <= screenBottom &&
                        drawArea.x <= screenRightEdge
                    ) {
                        nodesOnScreen.push(node)
                    } else {
                        node.visitedThisFrame = true
                    }
                }
            }
            return nodesOnScreen
        }

        /**
         * checks which node is in front, then constructs an edge between them in the directed graph
         *
         * @param {BodyNode} node1
         * @param {BodyNode} node2
         * @param {int} overlappingPixels - the number of pixels by which the two are overlapping
         * @private
         */
        private _constructEdge(
            node1: BodyNode,
            node2: BodyNode,
            overlappingPixels: int
        ) {
            //determine which node corresponds to the body in front
            var nodeInFront = node1
            var nodeBehind = node2
            if (shouldRenderInFront(node2.body, node1.body)) {
                nodeInFront = node2
                nodeBehind = node1
            }

            this._fadeOccludingSprite(
                nodeInFront,
                nodeBehind,
                overlappingPixels
            )

            //construct the edge (make the nodes point to each other)
            nodeInFront.before.push(nodeBehind)
        }

        /**
         * @param overlappingPixels - the number of pixels by which the two are overlapping
         */
        private _fadeOccludingSprite(
            nodeInFront: BodyNode,
            nodeBehind: BodyNode,
            overlappingPixels: int
        ) {
            for (const drawable of nodeInFront.drawables) {
                //If this sprite has the "playerOcclusionFadeFactor" property set to a value greater than zero, fade it out when player is behind
                if (drawable.playerOcclusionFadeFactor > 0.01) {
                    //If the active player is behind an object, lower the opacity
                    if (nodeBehind.isPlayer) {
                        var CROSS_FADE_PIXELS = 32

                        if (splitTime.debug.ENABLED) {
                            if (
                                drawable.playerOcclusionFadeFactor <
                                    0 ||
                                drawable.playerOcclusionFadeFactor > 1
                            ) {
                                console.error(
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
        }

        drawBodyTo(node: BodyNode) {
            for (const drawable of node.drawables) {
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
            const translateOriginTarget = drawable.getDesiredOrigin(node.body)
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

    /**
     * returns true if the body in question should render in front of the other body.
     *
     * @param {splitTime.Body} body1
     * @param {splitTime.Body} body2
     */
    function shouldRenderInFront(body1: splitTime.Body, body2: splitTime.Body) {
        if (isAbove(body1, body2) || isInFront(body1, body2)) {
            //if body1 is completely above or in front
            return true
        } else if (isAbove(body2, body1) || isInFront(body2, body1)) {
            //if body2 is completely above or in front
            return false
        }

        //If neither body is clearly above or in front,
        //go with the one whose base position is farther forward on the y axis
        return body1.y > body2.y
    }

    /**
     * returns true if body1's top is lower than body2's bottom
     *
     * @param {splitTime.Body} body1
     * @param {splitTime.Body} body2
     */
    function isAbove(body1: splitTime.Body, body2: splitTime.Body) {
        return body1.z >= body2.z + body2.height
    }

    /**
     * returns true if body1's backside is more forward than body2's front side
     *
     * @param {splitTime.Body} body1
     * @param {splitTime.Body} body2
     */
    function isInFront(body1: splitTime.Body, body2: splitTime.Body) {
        return body1.y - body1.depth / 2 >= body2.y + body2.depth / 2
    }

    class BodyNode {
        shouldBeDrawnThisFrame: boolean = false
        isPlayer: boolean = false
        visitedThisFrame: boolean = false
        overlappingWithPlayer: boolean = false
        drawables: splitTime.body.Drawable[]
        drawArea: math.Rect | null = null
        body: splitTime.Body
        /** bodies drawn before this one */
        before: BodyNode[] = []
        opacity: number = 1
        targetOpacity: number = 1
        constructor(body: splitTime.Body) {
            this.body = body
            this.drawables = body.drawables
        }
    }
}
