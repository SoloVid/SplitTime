namespace SplitTime.main {
    function mainFuncLoopBody() {
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
                    
                    SplitTime.dialog.notifyFrameUpdate();
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
            SplitTime.hud.render(SplitTime.see);
        } catch(ex) {
            console.error(ex);
        }
        SplitTime.performanceCheckpoint("SplitTime.hud.render");
        
        var endTime = new Date().getTime();
        var msElapsed = endTime - startTime;
        
        var displayFPS = SplitTime.FPS;
        if(msElapsed < SplitTime.msPerFrame) {
            setTimeout(mainFuncLoopBody, SplitTime.msPerFrame - msElapsed);
            SplitTime.see.fillStyle="#00FF00";
        } else {
            setTimeout(mainFuncLoopBody, 2); //give browser a quick breath
            var secondsElapsed = msElapsed/1000;
            displayFPS = Math.round(1/secondsElapsed);
            SplitTime.see.fillStyle="#FF0000";
        }
        
        if(SplitTime.debug.ENABLED) {
            SplitTime.debug.setDebugValue("FPS", displayFPS);
            SplitTime.debug.setDebugValue("Board Bodies", SplitTime.BoardRenderer.countBodies());
            SplitTime.debug.setDebugValue("Focus point", Math.round(SplitTime.BoardRenderer.getFocusPoint().x) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().y) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().z));
    
            SplitTime.debug.renderCanvas(SplitTime.see);
        }
    };

    export const State = {
        LOADING: "loading",
        ACTION: "action",
        OVERWORLD: "overworld",
        OTHER: "other"
    };
    
    var nextMainTimeoutId = null;

    export function start() {
        if(nextMainTimeoutId === null) {
            mainFuncLoopBody();
        }
    };
    
    export function stop() {
        clearTimeout(nextMainTimeoutId);
        nextMainTimeoutId = null;
    };
    
    export interface FrameNotified {
        /**
        * @param delta number of seconds passed (in real time) since last frame
        */
        notifyFrameUpdate(delta);
    }
}

namespace SplitTime.instanceOf {
    export function FrameNotified(obj: any): obj is SplitTime.main.FrameNotified {
        return typeof obj.notifyFrameUpdate === "function";
    }
}
