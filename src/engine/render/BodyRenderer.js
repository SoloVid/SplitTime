dependsOn("/world/DataSortedByOneValue.js");

SplitTime.BodyRenderer = function() {
    this._nextRef = 100;                          //Reserve the first 100 refs
    /** @type {BodyNode[]} */
    this._nodes = [];
	this._bodyToNodeIndexMap = {};
    // TODO: actual size
    //this._sortedData = new SplitTime.DataSortedByOneValue(10000);

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
	this._edgeCount = 0;
    for(var i = 0; i < this._nodes.length; i++) {
        var node = this._nodes[i];
        // This will be set back to true soon if appropriate
        node.shouldBeDrawnThisFrame = false;
        node.visitedThisFrame = false;
    }
};

/**
 * receives a body that needs to be rendered (called by BoardRenderer)
 * 
 * @param {SplitTime.Body} body
 */
SplitTime.BodyRenderer.prototype.feedBody = function(body) {
    var canvReq = body.getCanvasRequirements();    //MM - canvas req location is the "board location on this layer for center of canvas"
    if(!canvReq) {
        return;
    }
    var node = this._getBodyNode(body);
	node.canvReq = canvReq;
    
	//Sort sprites to determine which ones overlap on the x axis (an optimization to reduce comparisons)	
	//var halfWidth = Math.round(canvReq.width / 2);
	//this._sortedData.resort(node.refLeft, canvReq.x - halfWidth);  //sort from the leftmost point of the canvas
    //this._sortedData.resort(node.refRight, canvReq.x + halfWidth); //sort from the rightmost point of the canvas
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
        //this._sortedData.add(node.refLeft, node);
        //this._sortedData.add(node.refRight, node);
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
            //this._sortedData.remove(node.refLeft);
            //this._sortedData.remove(node.refRight);
        } else {
            this._removeNodeEdges(node);
        }
    }
};

SplitTime.BodyRenderer.prototype._rebuildGraph = function() {
    //For each node
	for(var i = 0; i < this._nodes.length; i++) {
        var node = this._nodes[i];
		var canvReq = node.canvReq;
		//Combine y and z axes to get the "screen y" position, which is the y location on the 2D screen
		var screenY = canvReq.y - canvReq.z; 
		
		//optimization for not drawing if out of bounds
		var screen = SplitTime.BoardRenderer.getScreenCoordinates();
		var screenBottom = screen.y + SplitTime.SCREENY;
		var screenRightEdge = screen.x + SplitTime.SCREENX;
		
		//If the body is in bounds 
		if(screenY >= screen.y && canvReq.x >= screen.x && (canvReq.y - node.body.yres) <= screenBottom && (canvReq.x - node.body.xres) <= screenRightEdge) {
			//For each other node we haven't visited yet
			for(var h = i; h < this._nodes.length; h++) {
				var otherNode = this._nodes[h];
				var otherCanvReq = otherNode.canvReq;
				
				//If the canvas requirements are not null and the nodes are not the same body
				if(otherCanvReq) {
					var otherScreenY = otherCanvReq.y - otherCanvReq.z;
					
					//Skip if the two bodies don't overlap on the screen's y axis (top to bottom)
					if(((screenY - (canvReq.height / 4)) < otherScreenY) && (screenY > (otherScreenY - (otherCanvReq.height / 4)))){
						var width1 = canvReq.width / 8;
						var width2 = otherCanvReq.width / 8;
						
						//Skip if the two bodies don't overlap on the x axis (left to right)
						if((canvReq.x - width1) < (otherCanvReq.x + width2) && (canvReq.x + width1) > (otherCanvReq.x - width2)) {
							this._constructEdge(node, otherNode);
						}
					}
				}
			}
		}
		else {
			node.visitedThisFrame = true;
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
    
};

/**
 * checks which node is in front, then constructs an edge between them in the directed graph
 *
 * @param {BodyNode} node1 
 * @param {BodyNode} node2 
 * @private
 */
SplitTime.BodyRenderer.prototype._constructEdge = function(node1, node2) {
    //determine which node corresponds to the body in front
    var nodeInFront = node1;
    var nodeBehind = node2;
    if(shouldRenderInFront(node2.body, node1.body)) {
        nodeInFront = node2;
        nodeBehind = node1;
    }

	//construct the edge (make the nodes point to each other)
    nodeInFront.before.push(nodeBehind);
    nodeBehind.after.push(nodeInFront);
};

/**
 * returns true if the body in question should render in front of the other body.
 *
 * @param {SplitTime.Body} body1
 * @param {SplitTime.Body} body2
 */
function shouldRenderInFront(body1, body2) {
	if(isAbove(body1, body2) || isInFront(body1, body2)) {  //if body1 is completely above or in front
        return true;
    } else if(isAbove(body2, body1) || isInFront(body2, body1)) {   //if body2 is completely above or in front
        return false;
    }
	//If neither body is clearly above or in front, 
	//go with the one whose base position is farther forward on the y axis
    return (body1.y > body2.y);
}

/**
 * returns true if body1's top is lower than body2's bottom
 *
 * @param {SplitTime.Body} body1
 * @param {SplitTime.Body} body2
 */
function isAbove(body1, body2) {
	return (body1.z > body2.z + body2.height);
}

/**
 * returns true if body1's backside is more forward than body2's frontside
 *
 * @param {SplitTime.Body} body1
 * @param {SplitTime.Body} body2
 */
function isInFront(body1, body2) {
	return (body1.y - body1.halfBaseLength > body2.y + body2.halfBaseLength);
}

/**
 *
 * @param {SplitTime.Body} body
 * @param canvasRequirements
 */
SplitTime.BodyRenderer.prototype.drawBodyTo = function(body, canvasRequirements) {
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

    this.visitedThisFrame = false;
    this.shouldBeDrawnThisFrame = false;
}
