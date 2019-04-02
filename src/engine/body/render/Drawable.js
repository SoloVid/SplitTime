dependsOn("../Body.js");

/**
 * @interface
 * @constructor
 */
SplitTime.Body.Drawable = function() {

};

SplitTime.Body.Drawable.prototype.lightIntensity = 0;
SplitTime.Body.Drawable.prototype.lightRadius = 150;

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {{x: int, y: int, z: int, width: number, height: number, isCleared: boolean}}
 */
SplitTime.Body.Drawable.prototype.getCanvasRequirements = function(x, y, z) {
    return {
        // 2D board location for center of canvas
        x: Math.round(x),
        y: Math.round(y),
        z: Math.round(z),
        width: 640,
        height: 480,
        isCleared: false
    };
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
