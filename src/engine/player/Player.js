SplitTime.Player = {};

/**
 * @type {SplitTime.Body}
 */
var activeBody;

/**
 * @return {SplitTime.Body}
 */
SplitTime.Player.getActiveBody = function() {
    return activeBody;
};
/**
 * @param {SplitTime.Body} body
 * @return {SLVD.Promise}
 */
SplitTime.Player.setActiveBody = function(body) {
    activeBody = body;
    return SplitTime.Level.setCurrent(body.getLevel()).then(SplitTime.Player.focusCameraOnActiveBody);
};

SplitTime.Player.focusCameraOnActiveBody = function() {
    SplitTime.BoardRenderer.setFocusPoint(activeBody);
};
