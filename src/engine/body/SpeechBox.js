dependsOn("Body.js");

/**
 *
 * @param {SplitTime.Body} body
 * @param {number} [offsetZ]
 * @param {number} [offsetX]
 * @param {number} [offsetY]
 * @class
 * @implements LevelLocation
 */
SplitTime.Body.SpeechBox = function(body, offsetZ, offsetX, offsetY) {
    this.body = body;
    this.offsetX = offsetX || 0;
    this.offsetY = offsetY || 0;
    this.offsetZ = offsetZ || 0;
};

/**
 * @return number
 */
SplitTime.Body.SpeechBox.prototype.getX = function() {
    return this.body.getX() + this.offsetX;
};
/**
 * @return number
 */
SplitTime.Body.SpeechBox.prototype.getY = function() {
    return this.body.getY() + this.offsetY;
};
/**
 * @return number
 */
SplitTime.Body.SpeechBox.prototype.getZ = function() {
    return this.body.getZ() + this.offsetZ;
};
/**
 * @return SplitTime.Level
 */
SplitTime.Body.SpeechBox.prototype.getLevel = function() {
    return this.body.getLevel();
};
