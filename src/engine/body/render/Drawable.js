dependsOn("../Body.js");

/**
 * @interface
 * @extends FrameNotified
 * @extends TimeNotified
 * @constructor
 */
SplitTime.Body.Drawable = function() {

};

SplitTime.Body.Drawable.prototype.playerOcclusionFadeFactor = 0;

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {SplitTime.Body.Drawable.CanvasRequirements}
 */
SplitTime.Body.Drawable.prototype.getCanvasRequirements = function(x, y, z) {
    return new SplitTime.Body.Drawable.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), 640, 480);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Body.Drawable.prototype.draw = function(ctx) {

};

SplitTime.Body.Drawable.prototype.prepareForRender = function() {

};
SplitTime.Body.Drawable.prototype.cleanupAfterRender = function() {

};

/**
 * @param {int} x
 * @param {int} y
 * @param {int} z
 * @param {int} width
 * @param {int} height
 * @constructor
 */
SplitTime.Body.Drawable.CanvasRequirements = function(x, y, z, width, height) {
    // Level location for center of canvas
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.height = height;
    this.isCleared = false;
    this.translateOrigin = true;
};
