namespace SplitTime {
    export function mainFunc() {
        var startTime = new Date().getTime();
        
        var agentCount = 0;
        
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
                    var region = SplitTime.Region.getCurrent();
                    region.notifyFrameUpdate(1/SplitTime.FPS);
                    SplitTime.performanceCheckpoint("region frame update");
                    
                    SplitTime.BoardRenderer.notifyFrameUpdate(1/SplitTime.FPS);
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
            setTimeout(SplitTime.mainFunc, SplitTime.msPerFrame - msElapsed);
            SplitTime.see.fillStyle="#00FF00";
        } else {
            setTimeout(SplitTime.mainFunc, 2); //give browser a quick breath
            var secondsElapsed = msElapsed/1000;
            displayFPS = Math.round(1/secondsElapsed);
            SplitTime.see.fillStyle="#FF0000";
        }
        
        SplitTime.debug.update({
            "FPS": displayFPS,
            "Board Bodies": SplitTime.BoardRenderer.countBodies(),
            "Focus point": Math.round(SplitTime.BoardRenderer.getFocusPoint().x) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().y) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().z),
            "Agents": agentCount,
            "HUD Layers": SplitTime.hud.getRendererCount(),
            "Joystick Direction": SplitTime.controls.JoyStick.getDirection()
        });
    };
    
    export namespace main {
        
        export const State = {
            LOADING: "loading",
            ACTION: "action",
            OVERWORLD: "overworld",
            OTHER: "other"
        };
        
        export interface FrameNotified {
            /**
            * @param delta number of seconds passed (in game time) since last frame
            */
            notifyFrameUpdate(delta);
        }
        
    }
}
