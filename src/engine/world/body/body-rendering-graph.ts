import { isOverlap } from "engine/utils/misc";
import { int } from "globals";
import { Rect } from "../../math/rect";
import { CanvasRequirements } from "./render/drawable";

export enum ordering {
    none = 0,
    bBehindA = 1,
    aBehindB = 2,
    softBBehindA = 3,
    softABehindB = 4,
}

export class BodyRenderingGraph {
    private _nodes: (GraphBodyNode | null)[] = []
    private _bodyToNodeIndexMap: { [ref: number]: number } = {}
    private _currentWalkIndex: number = 0

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
        const drawArea = Rect.make(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0, 0)
        for (const drawable of body.drawables) {
            const singleDrawArea = drawable.getCanvasRequirements().rect
            //Combine y and z axes to get the "screen y" position,
            // which is the y location on the 2D screen
            const combinedScreenY = body.y - body.z
            drawArea.x = Math.min(drawArea.x, singleDrawArea.x + body.x)
            drawArea.x2 = Math.max(drawArea.x2, singleDrawArea.x2 + body.x)
            drawArea.y = Math.min(drawArea.y, singleDrawArea.y + combinedScreenY)
            drawArea.y2 = Math.max(drawArea.y2, singleDrawArea.y2 + combinedScreenY)
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
        this._currentWalkIndex = 0
        for (const node of this._nodes) {
            if (node) {
                node.visitedThisFrame = false
            }
        }
        for (const node of this._nodes) {
            if (node) {
                this._visitNode(node, [], visitCallback)
            }
        }
    }

    private _visitNode(node: GraphBodyNode, nodeStack: GraphBodyNode[], visitCallback: (node: GraphBodyNode) => void) {
        if (node.visitedThisFrame) {
            return
        }
        // Don't violate hard ordering.
        for (const nodeBefore of node.before) {
            for (const nodeAfter of nodeStack) {
                if (nodeBefore === nodeAfter) {
                    return
                }
            }
        }
        node.visitedThisFrame = true

        nodeStack.push(node)

        for (const nodeBefore of node.before) {
            this._visitNode(nodeBefore, nodeStack, visitCallback)
        }

        for (const nodeBefore of node.softBefore) {
            this._visitNode(nodeBefore, nodeStack, visitCallback)
        }

        nodeStack.pop()

        visitCallback(node)
        this._currentWalkIndex++
    }

    private _removeDeadBodies() {
        for (var i = 0; i < this._nodes.length; i++) {
            var node = this._nodes[i]
            if (node) {
                if (!node.shouldBeDrawnThisFrame) {
                    this._nodes[i] = null
                } else {
                    node.before = []
                    node.softBefore = []
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

                //Skip if the two bodies don't overlap on the screen's y axis (top to bottom)
                if (isOverlap(drawArea.y, drawArea.height, otherDrawArea.y, otherDrawArea.height)) {
                    //Skip if the two bodies don't overlap on the x axis (left to right)
                    if (isOverlap(drawArea.x, drawArea.width, otherDrawArea.x, otherDrawArea.width)) {
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
        a: GraphBodyNode,
        b: GraphBodyNode
    ) {
        //construct the appropriate edge (make the nodes point to each other)
        switch (determineOrdering(a.body, b.body)) {
            case ordering.none:
                break
            case ordering.bBehindA:
                a.before.push(b)
                break
            case ordering.aBehindB:
                b.before.push(a)
                break
            case ordering.softBBehindA:
                a.softBefore.push(b)
                break
            case ordering.softABehindB:
                b.softBefore.push(a)
                break
        }
    }
}

/**
 * Determines which body should render in front of the other.
 */
function determineOrdering(a: GraphBody, b: GraphBody): ordering {
    // Special case for flat objects.
    // If both are flat, choose the smaller one to display on top.
    // This is primarily assuming the larger one is a background.
    if (a.z === b.z && a.height === 0 && b.height === 0) {
        const aSmaller = a.width * a.depth < b.width * b.depth
        return aSmaller ? ordering.softBBehindA : ordering.softABehindB
    }

    const aAboveB = isAbove(a, b)
    const aBeforeB = isInFront(a, b)
    const bAboveA = isAbove(b, a)
    const bBeforeA = isInFront(b, a)

    if ((aAboveB && !bBeforeA) || (aBeforeB && !bAboveA)) {
        //if a is completely above or in front
        // console.log(`${b.ref} is behind ${a.ref}`)
        return ordering.bBehindA
    }
    if ((bAboveA && !aBeforeB) || (bBeforeA && !aAboveB)) {
        //if b is completely above or in front
        // console.log(`${a.ref} is behind ${b.ref}`)
        return ordering.aBehindB
    }
    if (a.shouldRenderInFrontCustom) {
        const r = a.shouldRenderInFrontCustom(b)
        if (r !== undefined) {
            return r ? ordering.bBehindA : ordering.aBehindB
        }
    }
    if (b.shouldRenderInFrontCustom) {
        const r = b.shouldRenderInFrontCustom(a)
        if (r !== undefined) {
            return r ? ordering.aBehindB : ordering.bBehindA
        }
    }

    // If neither body is clearly above or in front,
    // go with the one whose base front is farther forward on the y axis.
    // This is a soft ordering because it might conflict with well-defined orderings.
    if (isFurtherForward(a, b)) {
        // console.log(`${b.ref} is softly behind ${a.ref}`)
        return ordering.softBBehindA
    }
    // console.log(`${a.ref} is softly behind ${b.ref}`)
    return ordering.softABehindB
}

/**
 * Is body1 above body2?
 * @returns true if body2's top is lower than (or at the same z level as) body1's bottom
 */
function isAbove(body1: GraphBody, body2: GraphBody) {
    return Math.round(body1.z) >= Math.round(body2.z) + body2.height
}

/**
 * Is body1 in front of body2?
 * @returns true if body1's backside is further forward than body2's front side
 */
function isInFront(body1: GraphBody, body2: GraphBody) {
    return Math.round(body1.y) - body1.depth / 2 >= Math.round(body2.y) + body2.depth / 2
}

/**
 * Is body1 further forward than body2?
 * @returns true if body1's frontside is further forward than body2's front side
 */
function isFurtherForward(body1: GraphBody, body2: GraphBody) {
    return Math.round(body1.y) + body1.depth / 2 > Math.round(body2.y) + body2.depth / 2
}

let nextNodeRef = 1
export class GraphBodyNode {
    readonly ref: int
    shouldBeDrawnThisFrame: boolean = false
    visitedThisFrame: boolean = false
    drawArea: Rect | null = null
    body: GraphBody
    /** bodies drawn before this one */
    before: GraphBodyNode[] = []
    /** bodies we'd prefer drawn before this one, but there might be issues with this order */
    softBefore: GraphBodyNode[] = []
    constructor(body: GraphBody) {
        this.ref = nextNodeRef++
        this.body = body
    }
}

export interface GraphBody {
    readonly ref: int
    readonly drawables: readonly GraphDrawable[]
    readonly x: number
    readonly y: number
    readonly z: number
    readonly width: int
    readonly depth: int
    readonly height: int
    readonly shouldRenderInFrontCustom?: (otherBody: GraphBody) => (boolean | undefined)
}

export interface GraphDrawable {
    readonly getCanvasRequirements: () => CanvasRequirements
}
