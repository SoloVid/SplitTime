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
 */
SplitTime.Player.setActiveBody = function(body) {
    activeBody = body;
    SplitTime.Player.focusCameraOnActiveBody();
};

SplitTime.Player.focusCameraOnActiveBody = function() {
    SplitTime.BoardRenderer.setFocusPoint(activeBody);
};
