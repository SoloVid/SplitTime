dependsOn("/world/DataSortedByOneValue.js");

SplitTime.BodyRenderer = function() {
    this._nextRef = 100;
    /** @type {BodyNode[]} */
    this._nodes = [];
    this._bodyToNodeIndexMap = {};
    // TODO: actual size
    this._sortedData = new SplitTime.DataSortedByOneValue(10000);

    this.screen = null;
    this.ctx = null;
};

/**
 * @param screen
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.BodyRenderer.prototype.notifyNewFrame = function(screen, ctx) {
    this.screen = screen;
    this.ctx = ctx;
    for(var i = 0; i < this._nodes.length; i++) {
        var node = this._nodes[i];
        // This will be set back to true soon if appropriate
        node.shouldBeDrawnThisFrame = false;
        node.visitedThisFrame = false;
    }
};

/**
 * @param {SplitTime.Body} body
 */
SplitTime.BodyRenderer.prototype.feedBody = function(body) {
    var canvReq = body.getCanvasRequirements();
    if(!canvReq) {
        return;
    }

    var node = this._getBodyNode(body);
    // TODO: maybe also add width/height/etc?
    if(canvReq.x !== node.canvReq.x || canvReq.y !== node.canvReq.y || canvReq.z !== node.canvReq.z) {
        node.shouldRecalculateEdges = true;
    }
    node.canvReq = canvReq;
    var halfWidth = Math.round(canvReq.width / 2);
    this._sortedData.resort(node.refLeft, canvReq.x - halfWidth);
    this._sortedData.resort(node.refRight, canvReq.x + halfWidth);
    node.shouldBeDrawnThisFrame = true;
};

/**
 * @param {SplitTime.Body} body
 * @return {BodyNode}
 * @private
 */
SplitTime.BodyRenderer.prototype._getBodyNode = function(body) {
    if(!(body.ref in this._bodyToNodeIndexMap)) {
        var node = new BodyNode(body, this._nextRef++, this._nextRef++);
        var index = this._nodes.length;
        this._nodes.push(node);
        this._bodyToNodeIndexMap[body.ref] = index;
        this._sortedData.add(node.refLeft, node);
        this._sortedData.add(node.refRight, node);
        return node;
    }
    return this._nodes[this._bodyToNodeIndexMap[body.ref]];
};

SplitTime.BodyRenderer.prototype.render = function() {
    this._removeDeadBodies();
    this._rebuildGraph();
    for(var i = 0; i < this._nodes.length; i++) {
        var node = this._nodes[i];
        this._visitNode(node);
    }
};

/**
 * @param {BodyNode} node
 * @private
 */
SplitTime.BodyRenderer.prototype._visitNode = function(node) {
    if(node.visitedThisFrame) {
        return;
    }
    node.visitedThisFrame = true;

    for(var i = 0; i < node.before.length; i++) {
        this._visitNode(node.before[i]);
    }

    this.drawBodyTo(node.body, node.canvReq);
};

SplitTime.BodyRenderer.prototype._removeDeadBodies = function() {
    for(var i = this._nodes.length - 1; i >= 0; i--) {
        var node = this._nodes[i];
        if(!node.shouldBeDrawnThisFrame) {
            this._nodes.splice(i, 1);
            this._sortedData.remove(node.refLeft);
            this._sortedData.remove(node.refRight);
        } else if(node.shouldRecalculateEdges) {
            this._removeNodeEdges(node);
        }
    }
};

SplitTime.BodyRenderer.prototype._rebuildGraph = function() {
    for(var i = 0; i < this._nodes.length; i++) {
        var node = this._nodes[i];
        if(node.shouldRecalculateEdges) {
            this._recalculateNodeEdges(node);
            node.shouldRecalculateEdges = false;
        }
    }
};

/**
 * @param {BodyNode} node
 * @private
 */
SplitTime.BodyRenderer.prototype._removeNodeEdges = function(node) {
    for(var iAfter = 0; iAfter < node.after.length; iAfter++) {
        var afterNode = node.after[iAfter];
        // TODO: This line represents a quick-thought but not working solution to a problem with this setup
        // Smaller object won't recalculate with larger object that completely surrounds
        afterNode.shouldRecalculateEdges = true;
        var myIndexInAfter = afterNode.before.indexOf(node);
        if(myIndexInAfter < 0) {
            console.error("node for " + node.body.ref + " not found in after's before list");
        }
        afterNode.before.splice(myIndexInAfter, 1);
    }
    node.after = [];
    for(var iBefore = 0; iBefore < node.before.length; iBefore++) {
        var beforeNode = node.before[iBefore];
        var myIndexInBefore = beforeNode.after.indexOf(node);
        if(myIndexInBefore < 0) {
            console.error("node for " + node.body.ref + " not found in before's after list");
        }
        beforeNode.after.splice(myIndexInBefore, 1);
    }
    node.before = [];
};

/**
 * @param {BodyNode} node
 * @private
 */
SplitTime.BodyRenderer.prototype._recalculateNodeEdges = function(node) {
    var canvReq = node.canvReq;
    var screenY = canvReq.y - canvReq.z;
    var that = this;
    var halfWidth = Math.round(canvReq.width / 2);
    this._sortedData.forEachInRange(canvReq.x - halfWidth, canvReq.x + halfWidth, function(otherNode) {
        if(node === otherNode) {
            return;
        }
        var otherCanvReq = otherNode.canvReq;
        var otherScreenY = otherCanvReq.y - canvReq.z;
        if(isYOverlap(screenY, canvReq.height, otherScreenY, otherCanvReq.height)) {
            that._constructEdge(node, otherNode);
        }
    });
};

/**
 * @param {BodyNode} node1
 * @param {BodyNode} node2
 * @private
 */
SplitTime.BodyRenderer.prototype._constructEdge = function(node1, node2) {
    if(node1.before.indexOf(node2) > 0 || node1.after.indexOf(node2) > 0) {
        return;
    }

    var nodeInFront = node1;
    var nodeBehind = node2;
    if(isBodyInFront(node2.body, node1.body)) {
        nodeInFront = node2;
        nodeBehind = node1;
    }

    nodeInFront.before.push(nodeBehind);
    nodeBehind.after.push(nodeInFront);
};

/**
 * @param {SplitTime.Body} bodyInQuestion
 * @param {SplitTime.Body} otherBody
 */
function isBodyInFront(bodyInQuestion, otherBody) {
    var isTopHigher = bodyInQuestion.z + bodyInQuestion.height > otherBody.z + otherBody.height;
    var isFrontMoreForward = bodyInQuestion.y + bodyInQuestion.halfBaseLength > otherBody.y + otherBody.halfBaseLength;
    if(isTopHigher && isFrontMoreForward) {
        return true;
    } else if(!isTopHigher && !isFrontMoreForward) {
        return false;
    } else if(bodyInQuestion.y < otherBody.y && bodyInQuestion.z < otherBody.z + otherBody.height) {
        return false;
    } else if(isTopHigher) {
        return true;
    }
    return false;
}

function isYOverlap(y1, height1, y2, height2) {
    var top1 = y1 - height1 / 2;
    var top2 = y2 - height2 / 2;
    var noOverlap = top1 + height1 <= top2 || top2 + height2 <= top1;
    return !noOverlap;
}

/**
 *
 * @param {SplitTime.Body} body
 * @param canvasRequirements
 */
SplitTime.BodyRenderer.prototype.drawBodyTo = function(body, canvasRequirements) {
    // TODO: add optimization for not drawing if out of bounds

    // TODO: potentially give the body a cleared personal canvas if requested

    // Translate origin to body location
    this.ctx.translate(Math.round(canvasRequirements.x - this.screen.x), Math.round(canvasRequirements.y - canvasRequirements.z - this.screen.y));
    body.see(this.ctx);
    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // TODO: address these commented items as their proper location should be moved
    //     //Determine if SplitTime.onBoard.bodies is lighted
    //     if(cBody.isLight) {
    //         lightedThings.push(cBody);
    //     }
    //
    //     cBody.resetStance();
    //     cBody.resetCans();
};

function BodyNode(body, refLeft, refRight) {
    /** @type {SplitTime.Body} */
    this.body = body;
    /** @type {BodyNode[]} bodies drawn before this one */
    this.before = [];
    /** @type {BodyNode[]} bodies drawn after this one */
    this.after = [];

    this.canvReq = {};

    this.refLeft = refLeft;
    this.refRight = refRight;

    this.shouldRecalculateEdges = true;
    this.visitedThisFrame = false;
    this.shouldBeDrawnThisFrame = false;
}
