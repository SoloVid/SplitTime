namespace splitTime.body {
    export class BodyRenderingGraph {
        private _nodes: (GraphBodyNode | null)[] = []
        private _bodyToNodeIndexMap: { [ref: number]: number } = {}

        notifyNewFrame() {
            for (var i = 0; i < this._nodes.length; i++) {
                var node = this._nodes[i]
                if (node) {
                    // This will be set back to true soon if appropriate
                    node.shouldBeDrawnThisFrame = false
                }
            }
        }

        /**
         * receives a body that needs to be rendered (called by BoardRenderer)
         */
        feedBody(body: GraphBody): GraphBodyNode {
            if (body.drawables.length === 0) {
                throw new Error("No drawables")
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
            // FTODO: cache stuff we care about and check here if anything actually changed
            // then if nothing changed, we can skip over this node in updating graph
            node.drawArea = drawArea
            node.shouldBeDrawnThisFrame = true
            return node
        }

        private _getBodyNode(body: GraphBody): GraphBodyNode {
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
            var node = new GraphBodyNode(body)
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

        walk(visitCallback: (node: GraphBodyNode) => void): void {
            for (const node of this._nodes) {
                if (node) {
                    node.visitedThisFrame = false
                }
            }
            for (const node of this._nodes) {
                if (node) {
                    this._visitNode(node, visitCallback)
                }
            }
        }

        private _visitNode(node: GraphBodyNode, visitCallback: (node: GraphBodyNode) => void) {
            if (node.visitedThisFrame) {
                return
            }
            node.visitedThisFrame = true

            for (var i = 0; i < node.before.length; i++) {
                this._visitNode(node.before[i], visitCallback)
            }

            visitCallback(node)
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

        rebuildGraph() {
            this._removeDeadBodies()
            //For each node
            for (var i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i]
                if (!node) {
                    continue
                }
                const drawArea = node.drawArea
                //FTODO: revisit
                if (!drawArea) {
                    continue
                }

                //For each other node we haven't visited yet
                for (var h = i + 1; h < this._nodes.length; h++) {
                    const otherNode = this._nodes[h]
                    if (!otherNode) {
                        continue
                    }
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
                            this._constructEdge(
                                node,
                                otherNode
                            )
                        }
                    }
                }
            }
        }

        /**
         * checks which node is in front, then constructs an edge between them in the directed graph
         */
        private _constructEdge(
            node1: GraphBodyNode,
            node2: GraphBodyNode
        ) {
            //determine which node corresponds to the body in front
            let nodeInFront = node1
            let nodeBehind = node2
            const isThisOrderCorrect = shouldRenderInFront(node2.body, node1.body)
            if (isThisOrderCorrect === undefined) {
                return
            }
            if (isThisOrderCorrect) {
                nodeInFront = node2
                nodeBehind = node1
            }

            //construct the edge (make the nodes point to each other)
            nodeInFront.before.push(nodeBehind)
        }
    }

    /**
     * returns true if the body in question should render in front of the other body.
     */
    function shouldRenderInFront(body1: GraphBody, body2: GraphBody): boolean | undefined {
        if (isAbove(body1, body2) || isInFront(body1, body2)) {
            //if body1 is completely above or in front
            return true
        } else if (isAbove(body2, body1) || isInFront(body2, body1)) {
            //if body2 is completely above or in front
            return false
        }

        // If neither body is clearly above or in front,
        // don't make a determination because this pair's
        // rendering order could mess with other well-defined
        // rendering orders for other pairs.
        return undefined
        //If neither body is clearly above or in front,
        //go with the one whose base front is farther forward on the y axis
        // return isFurtherForward(body1, body2)
    }

    /**
     * returns true if body1's top is lower than body2's bottom
     */
    function isAbove(body1: GraphBody, body2: GraphBody) {
        return body1.z >= body2.z + body2.height
    }

    /**
     * returns true if body1's backside is further forward than body2's front side
     */
    function isInFront(body1: GraphBody, body2: GraphBody) {
        return body1.y - body1.depth / 2 >= body2.y + body2.depth / 2
    }

    /**
     * returns true if body1's frontside is further forward than body2's front side
     */
    function isFurtherForward(body1: GraphBody, body2: GraphBody) {
        return body1.y + body1.depth / 2 > body2.y + body2.depth / 2
    }

    let nextNodeRef = 1
    export class GraphBodyNode {
        readonly ref: int
        shouldBeDrawnThisFrame: boolean = false
        visitedThisFrame: boolean = false
        drawArea: math.Rect | null = null
        body: GraphBody
        /** bodies drawn before this one */
        before: GraphBodyNode[] = []
        constructor(body: GraphBody) {
            this.ref = nextNodeRef++
            this.body = body
        }
    }

    export interface GraphBody {
        ref: int
        drawables: GraphDrawable[]
        x: number
        y: number
        z: number
        width: int
        depth: int
        height: int
    }

    export interface GraphDrawable {
        getCanvasRequirements(): splitTime.body.CanvasRequirements
    }
}
