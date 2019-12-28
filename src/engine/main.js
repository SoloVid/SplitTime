var nextMainTimeoutId = null;

SplitTime.main = function() {
    var startTime = new Date().getTime();

    SplitTime.performanceCheckpoint("start", 999999);

    try {
        SplitTime.Level.applyTransition();
        SplitTime.performanceCheckpoint("level transition", 10);

        switch(SplitTime.process) {
            case SplitTime.main.State.LOADING: {
                SplitTime.see.fillStyle = "#000000";
                SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
                SplitTime.see.font = "30px Arial";
                SplitTime.see.fillStyle = "#FFFFFF";
                SplitTime.see.fillText("Loading...", 250, 230);
                break;
            }
            case SplitTime.main.State.ACTION: {
                var secondsForFrame = 1/SplitTime.FPS;

                var timeline = SplitTime.Timeline.getCurrent();
                timeline.notifyFrameUpdate(secondsForFrame);

                SplitTime.performanceCheckpoint("timeline frame update");

                var region = SplitTime.Region.getCurrent();
                region.notifyFrameUpdate(secondsForFrame);

                SplitTime.performanceCheckpoint("region frame update");

                SplitTime.BoardRenderer.notifyFrameUpdate(secondsForFrame);
                SplitTime.BoardRenderer.renderBoardState(true);
                SplitTime.performanceCheckpoint("SplitTime.BoardRenderer.renderBoardState");

                SplitTime.DialogManager.notifyFrameUpdate();
                SplitTime.performanceCheckpoint("SplitTime.DialogManager.notifyFrameUpdate");

                break;
            }
            default: {
                // TODO: don't allow random game states
                // SplitTime.Logger.warn("Invalid main game state: " + SplitTime.process);
            }
        }
    } catch(ex) {
        console.error(ex);
    }

    try {
        SplitTime.HUD.render(SplitTime.see);
    } catch(ex) {
        console.error(ex);
    }
    SplitTime.performanceCheckpoint("SplitTime.HUD.render");

    var endTime = new Date().getTime();
    var msElapsed = endTime - startTime;

    var displayFPS = SplitTime.FPS;
    if(msElapsed < SplitTime.msPerFrame) {
        nextMainTimeoutId = setTimeout(SplitTime.main, SplitTime.msPerFrame - msElapsed);
        SplitTime.see.fillStyle="#00FF00";
    } else {
        nextMainTimeoutId = setTimeout(SplitTime.main, 2); //give browser a quick breath
        var secondsElapsed = msElapsed/1000;
        displayFPS = Math.round(1/secondsElapsed);
        SplitTime.see.fillStyle="#FF0000";
    }

    if(SplitTime.Debug.ENABLED) {
        SplitTime.Debug.setDebugValue("FPS", displayFPS);
        SplitTime.Debug.setDebugValue("Board Bodies", SplitTime.BoardRenderer.countBodies());
        SplitTime.Debug.setDebugValue("Focus point", Math.round(SplitTime.BoardRenderer.getFocusPoint().x) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().y) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().z));

        SplitTime.Debug.renderCanvas(SplitTime.see);
    }
};

SplitTime.main.State = {
    LOADING: "loading",
    ACTION: "action",
    OVERWORLD: "overworld",
    OTHER: "other"
};

SplitTime.main.start = function() {
    if(nextMainTimeoutId === null) {
        SplitTime.main();
    }
};

SplitTime.main.stop = function() {
    clearTimeout(nextMainTimeoutId);
    nextMainTimeoutId = null;
};

/**
 * @interface
 */
function FrameNotified() {}

/**
 * @param delta number of seconds passed (in real time) since last frame
 */
FrameNotified.prototype.notifyFrameUpdate = function(delta) {};
