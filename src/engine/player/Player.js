SplitTime.Player = {};

(function() {
    var activeBody;
    SplitTime.Player.getActiveBody = function() {
        return activeBody;
    };
    SplitTime.Player.setActiveBody = function(body) {
        activeBody = body;
        SplitTime.Player.focusCameraOnActiveBody();
    };

    SplitTime.Player.focusCameraOnActiveBody = function() {
        SplitTime.BoardRenderer.setFocusPoint(activeBody);
    };
} ());