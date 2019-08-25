SplitTime.Player = {};

/**
 * @type {SplitTime.Agent.Player}
 */
var activePlayerAgent;

/**
 * @type {SplitTime.Body}
 */
var activeBody;

/**
 * @return {SplitTime.Agent.Player}
 */
SplitTime.Player.getActivePlayerAgent = function() {
    return activePlayerAgent;
};
/**
 * @return {SplitTime.Body}
 */
SplitTime.Player.getActiveBody = function() {
    return activeBody;
};
/**
 * @param {SplitTime.Agent.Player} playerAgent
 * @return {SLVD.Promise}
 */
SplitTime.Player.setActivePlayer = function(playerAgent) {
    activePlayerAgent = playerAgent;
    activeBody = playerAgent.body;
    return SplitTime.Level.setCurrent(activeBody.getLevel()).then(SplitTime.Player.focusCameraOnActiveBody);
};

SplitTime.Player.focusCameraOnActiveBody = function() {
    SplitTime.BoardRenderer.setFocusPoint(activeBody);
};
