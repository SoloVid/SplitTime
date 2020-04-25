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
            if (!body.drawable) {
                return
            }
            var canvReq = body.drawable.getCanvasRequirements(
                body.x,
                body.y,
                body.z
            )
            var node = this._getBodyNode(body)
            node.drawable = body.drawable
            node.canvReq = canvReq
            node.shouldBeDrawnThisFrame = true
            node.isPlayer = isPlayer
        }

        private _getBodyNode(body: splitTime.Body): BodyNode {
            // If the body is unaccounted or misplaced, set up a new node
            if (body.ref in this._bodyToNodeIndexMap) {
                const node = this._nodes[this._bodyToNodeIndexMap[body.ref]]
                if (node) {
                    if (node.body !== body) {
                        return node
                    }
                }
            }
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
                var node = nodesOnScreen[i]
                var canvReq = node.canvReq
                //FTODO: revisit
                if (!canvReq) {
                    continue
                }
                //Combine y and z axes to get the "screen y" position, which is the y location on the 2D screen
                var nodeBottom = canvReq.y - canvReq.z

                //Half width/height is used for determining the edge of
                //  the visible body relative to the y position (bottom)
                //  and x position (center of the body).
                var halfWidth = canvReq.width / 2
                var height = canvReq.height

                //For each other node we haven't visited yet
                for (var h = i + 1; h < nodesOnScreen.length; h++) {
                    var otherNode = nodesOnScreen[h]
                    var otherCanvReq = otherNode.canvReq
                    //FTODO: revisit
                    if (!otherCanvReq) {
                        continue
                    }

                    var otherNodeBottom = otherCanvReq.y - otherCanvReq.z
                    var otherHeight = otherCanvReq.height

                    var yDiffVal1 = nodeBottom - (otherNodeBottom - otherHeight)
                    var yDiffVal2 = otherNodeBottom - (nodeBottom - height)

                    //Skip if the two bodies don't overlap on the screen's y axis (top to bottom)
                    if (yDiffVal1 > 0 && yDiffVal2 > 0) {
                        var otherHalfWidth = otherCanvReq.width / 2

                        var xDiffVal1 =
                            otherCanvReq.x +
                            otherHalfWidth -
                            (canvReq.x - halfWidth)
                        var xDiffVal2 =
                            canvReq.x +
                            halfWidth -
                            (otherCanvReq.x - otherHalfWidth)

                        //Skip if the two bodies don't overlap on the x axis (left to right)
                        if (xDiffVal1 > 0 && xDiffVal2 > 0) {
                            var bottomDiff = Math.abs(
                                otherNodeBottom - nodeBottom
                            )
                            var overlappingPixels = Math.min(
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
                    var canvReq = node.canvReq
                    //FTODO: revisit
                    if (!canvReq) {
                        continue
                    }

                    //Combine y and z axes to get the "screen y" position,
                    //which is the y location of the bottom of
                    //the node on the 2D screen
                    var nodeScreenY = canvReq.y - canvReq.z

                    //optimization for not drawing if out of bounds
                    var screen = this.camera.getScreenCoordinates()
                    var screenBottom = screen.y + this.camera.SCREEN_HEIGHT
                    var screenRightEdge = screen.x + this.camera.SCREEN_WIDTH

                    //If the body is in bounds
                    if (
                        nodeScreenY >= screen.y &&
                        canvReq.x + canvReq.width / 2 >= screen.x &&
                        nodeScreenY - canvReq.height <= screenBottom &&
                        canvReq.x - canvReq.width / 2 <= screenRightEdge
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
         * @param {BodyNode} nodeInFront
         * @param {BodyNode} nodeBehind
         * @param {int} overlappingPixels - the number of pixels by which the two are overlapping
         * @private
         */
        private _fadeOccludingSprite(
            nodeInFront: BodyNode,
            nodeBehind: BodyNode,
            overlappingPixels: int
        ) {
            if (!nodeInFront.drawable) {
                return
            }
            //If this sprite has the "playerOcclusionFadeFactor" property set to a value greater than zero, fade it out when player is behind
            if (nodeInFront.drawable.playerOcclusionFadeFactor > 0.01) {
                //If the active player is behind an object, lower the opacity
                if (nodeBehind.isPlayer) {
                    var CROSS_FADE_PIXELS = 32

                    if (splitTime.debug.ENABLED) {
                        if (
                            nodeInFront.drawable.playerOcclusionFadeFactor <
                                0 ||
                            nodeInFront.drawable.playerOcclusionFadeFactor > 1
                        ) {
                            console.error(
                                "Sprite specified with playerOcclusionFadeFactor invalid value: " +
                                    nodeInFront.drawable
                                        .playerOcclusionFadeFactor
                            )
                            return
                        }
                    }

                    //Fade in gradually based on the number of overlapping pixels
                    var crossFadeFactor = Math.min(
                        overlappingPixels / CROSS_FADE_PIXELS,
                        1
                    )
                    var pixelsFactor =
                        crossFadeFactor *
                        nodeInFront.drawable.playerOcclusionFadeFactor
                    nodeInFront.targetOpacity = 1 - pixelsFactor
                }
            }
        }

        drawBodyTo(node: BodyNode) {
            //FTODO: revisit
            if (!this.ctx || !this.screen) {
                return
            }
            // TODO: potentially give the body a cleared personal canvas if requested

            var canvReq = node.canvReq
            //FTODO: revisit
            if (!canvReq) {
                return
            }

            if (!node.drawable) {
                return
            }

            // Translate origin to body location
            if (canvReq.translateOrigin) {
                this.ctx.translate(
                    Math.round(canvReq.x - this.screen.x),
                    Math.round(canvReq.y - canvReq.z - this.screen.y)
                )
            } else {
                this.ctx.translate(
                    Math.round(0 - this.screen.x),
                    Math.round(0 - this.screen.y)
                )
            }

            //Set the opacity for this body, but ease toward it
            node.opacity = splitTime.approachValue(
                node.opacity,
                node.targetOpacity,
                0.05
            )
            this.ctx.globalAlpha = node.opacity

            //Draw the body
            node.drawable.draw(this.ctx)

            //Reset opacity settings back to 1 ("not opaque")
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
     * returns true if body1's backside is more forward than body2's frontside
     *
     * @param {splitTime.Body} body1
     * @param {splitTime.Body} body2
     */
    function isInFront(body1: splitTime.Body, body2: splitTime.Body) {
        return body1.y - body1.halfBaseLength >= body2.y + body2.halfBaseLength
    }

    class BodyNode {
        shouldBeDrawnThisFrame: boolean
        isPlayer: boolean = false
        visitedThisFrame: boolean
        overlappingWithPlayer: boolean = false
        drawable: splitTime.body.Drawable | null
        canvReq: splitTime.body.CanvasRequirements | null
        body: splitTime.Body
        /** @type {BodyNode[]} bodies drawn before this one */
        before: BodyNode[]
        opacity: number
        targetOpacity: number
        constructor(body: splitTime.Body) {
            this.body = body
            this.drawable = body.drawable
            this.before = []

            this.canvReq = null

            this.visitedThisFrame = false
            this.shouldBeDrawnThisFrame = false
            this.opacity = 1
            this.targetOpacity = 1
        }
    }
}
