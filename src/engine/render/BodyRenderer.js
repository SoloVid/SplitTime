SplitTime.BodyRenderer = function() {
    /** @type {BodyNode[]} */
    this._nodes = [];
    this._bodyToNodeIndexMap = {};

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
 * receives a body that needs to be rendered (called by BoardRenderer)
 * 
 * @param {SplitTime.Body} body
 */
SplitTime.BodyRenderer.prototype.feedBody = function(body) {
    var canvReq = body.getCanvasRequirements();    // canvas req location is the "board location on this layer for center of canvas"
    if(!canvReq) {
        return;
    }
    var node = this._getBodyNode(body);
    node.canvReq = canvReq;
    node.shouldBeDrawnThisFrame = true;
};

/**
 * @param {SplitTime.Body} body
 * @return {BodyNode}
 * @private
 */
SplitTime.BodyRenderer.prototype._getBodyNode = function(body) {
    if(!(body.ref in this._bodyToNodeIndexMap)) {
        var node = new BodyNode(body);
        var index = this._nodes.length;
        this._nodes.push(node);
        this._bodyToNodeIndexMap[body.ref] = index;
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

    this.drawBodyTo(node);
};

SplitTime.BodyRenderer.prototype._removeDeadBodies = function() {
    for(var i = this._nodes.length - 1; i >= 0; i--) {
        var node = this._nodes[i];
        if(!node.shouldBeDrawnThisFrame) {
            this._nodes.splice(i, 1);
        } else {
            node.before = [];
        }
    }
};

SplitTime.BodyRenderer.prototype._rebuildGraph = function() {
    //optimization for not drawing if out of bounds
    var nodesOnScreen = this._getNodesOnScreen();
    //For each node
    for(var i = 0; i < nodesOnScreen.length; i++) {
        var node = nodesOnScreen[i];
        var canvReq = node.canvReq;
        //Combine y and z axes to get the "screen y" position, which is the y location on the 2D screen
        var screenY = canvReq.y - canvReq.z;
        
		//Half width/height is used for determining the edge of 
		//	the visible body relative to the y position (bottom)
		//  and x position (center of the body).
		//Note that I've subtracted 2px from this to account for
		//	the empty space around objects in the .png files.
		var halfWidth = (node.body.xres / 2) - 2;
		var height = (node.body.yres) - 2;

        //For each other node we haven't visited yet
        for(var h = i + 1; h < nodesOnScreen.length; h++) {
            var otherNode = nodesOnScreen[h];
            var otherCanvReq = otherNode.canvReq;

            var otherScreenY = otherCanvReq.y - otherCanvReq.z;
            var otherHeight = (otherNode.body.yres) - 2;

            //Skip if the two bodies don't overlap on the screen's y axis (top to bottom)
            if(screenY > otherScreenY - otherHeight){
				if (screenY - height < otherScreenY){
					var otherHalfWidth = (otherNode.body.xres / 2) - 2;

					//Skip if the two bodies don't overlap on the x axis (left to right)
					if((canvReq.x - halfWidth) < (otherCanvReq.x + otherHalfWidth) && (canvReq.x + halfWidth) > (otherCanvReq.x - otherHalfWidth)) {
						this._constructEdge(node, otherNode);
					}
				}
            }
        }
    }
};

SplitTime.BodyRenderer.prototype._getNodesOnScreen = function() {
    var nodesOnScreen = [];
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
        if(
            (screenY + canvReq.height / 2) >= screen.y &&
            (canvReq.x + canvReq.width / 2) >= screen.x &&
            (canvReq.y - canvReq.height / 2) <= screenBottom &&
            (canvReq.x - canvReq.width / 2) <= screenRightEdge
        ) {
            nodesOnScreen.push(node);
        } else {
            node.visitedThisFrame = true;
        }
    }
    return nodesOnScreen;
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
	
	//If the active player is behind an object, lower the opacity
	if(nodeBehind.body === SplitTime.Player.getActiveBody())
	{
		nodeInFront.opacity = 0.7;
	}
	
    //construct the edge (make the nodes point to each other)
    nodeInFront.before.push(nodeBehind);
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
    return (body1.z >= body2.z + body2.height);
}

/**
 * returns true if body1's backside is more forward than body2's frontside
 *
 * @param {SplitTime.Body} body1
 * @param {SplitTime.Body} body2
 */
function isInFront(body1, body2) {
    return (body1.y - body1.halfBaseLength >= body2.y + body2.halfBaseLength);
}

/**
 *
 * @param {BodyNode} node
 */
SplitTime.BodyRenderer.prototype.drawBodyTo = function(node) {
    // TODO: potentially give the body a cleared personal canvas if requested
	
	canvReq = node.canvReq;

    // Translate origin to body location
    this.ctx.translate(Math.round(canvReq.x - this.screen.x), Math.round(canvReq.y - canvReq.z - this.screen.y));
    
	//Set the opacity for this body
	this.ctx.globalAlpha = node.opacity;
	
	//Draw the body
	node.body.see(this.ctx);
	
	//Reset opacity settings back to 1 ("not opaque")
	this.ctx.globalAlpha = 1;
	node.opacity = 1;
	
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

function BodyNode(body) {
    /** @type {SplitTime.Body} */
    this.body = body;
    /** @type {BodyNode[]} bodies drawn before this one */
    this.before = [];

    this.canvReq = {};

	this.visitedThisFrame = false;
    this.shouldBeDrawnThisFrame = false;
	this.opacity = 1;
}
