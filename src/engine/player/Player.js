SplitTime.Player = {};

(function() {
    var activeBody;
    SplitTime.Player.getActiveBody = function() {
        return activeBody;
    };
    SplitTime.Player.setActiveBody = function(body) {
        var updateFocusedBody = false;
        var focusedBody = SplitTime.Body.getFocused();
        if(focusedBody === null || focusedBody === activeBody) {
            updateFocusedBody = true;
        }
        activeBody = body;
        if(updateFocusedBody) {
            SplitTime.Player.focusCameraOnActiveBody();
        }
    };

    SplitTime.Player.focusCameraOnActiveBody = function() {
        SplitTime.Body.setFocused(activeBody);
    };
} ());