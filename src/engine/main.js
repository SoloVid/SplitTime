SplitTime.main = function() {
    var startTime = new Date().getTime();

    var agentCount = 0;

    try {
        var loopStart = new Date(); //for speed checking
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
                // TODO: figure out a better place to put this; might not work for switching regions
                SplitTime.Level.setCurrent(SplitTime.Player.getActiveBody().getLevel());

                var region = SplitTime.Region.getCurrent();
                //Advance one second per second (given 20ms SplitTime.main interval)
                // if(clock.isSignaling()) {
                    region.getTime().advance(SplitTime.msPerFrame);
                // }
                region.TimeStabilizer.notifyFrameUpdate();
                var timeAdvance = new SLVD.speedCheck("SplitTime.Time.advance", loopStart);
                timeAdvance.logUnusual();

                region.forEachBody(function(body) {
                    body.zVelocity += body.getPixelGravityForFrame();
                });

                region.forEachAgent(function(agent) {
                    try {
                        if(typeof agent.notifyFrameUpdate === "function") {
                            agent.notifyFrameUpdate();
                        }
                    } catch(ex) {
                        console.error(ex);
                    }
                });

                region.forEachBody(function(body) {
                    if(Math.abs(body.zVelocity) > 0.00001) {
                        var expectedDZ = body.getPixelZVelocityForFrame();
                        var mover = new SplitTime.Body.Mover(body);
                        var actualDZ = mover.zeldaVerticalBump(expectedDZ);
                        if(Math.abs(actualDZ) < Math.abs(expectedDZ)) {
                            body.zVelocity = 0;
                        }
                    }
                });

                var agentsUpdate = new SLVD.speedCheck("agents update", timeAdvance.date);
                agentsUpdate.logUnusual();

                if(SplitTime.process !== SplitTime.main.State.ACTION) {
                    break;
                }

                SplitTime.BoardRenderer.renderBoardState(true);
                var renderCheck = new SLVD.speedCheck("SplitTime.BoardRenderer.renderBoardState", agentsUpdate.date);
                renderCheck.logUnusual(5);

                SplitTime.DialogManager.notifyFrameUpdate();
                var dialogCheck = new SLVD.speedCheck("SplitTime.DialogManager.notifyFrameUpdate", renderCheck.date);
                dialogCheck.logUnusual();

                break;
            }
            // case "TRPG": {
            //     if(SplitTime.cTeam == SplitTime.player) {
            //         SplitTime.TRPGPlayerMotion();
            //     }
            //     else if(SplitTime.cTeam == boardNPC) {
            //         SplitTime.TRPGNPCMotion();
            //     }
            //     SplitTime.onBoard.sortBodies();
            //
            //     SplitTime.renderBoardState(true);
            //     break;
            // }
            default: {}
        }

        SplitTime.FrameStabilizer.notifyFrameUpdate();
    } catch(ex) {
        console.error(ex);
    }

    try {
        SplitTime.HUD.render(SplitTime.see);
    } catch(ex) {
        console.error(ex);
    }

    var endTime = new Date().getTime();
    var msElapsed = endTime - startTime;

    var displayFPS = SplitTime.FPS;
    if(msElapsed < SplitTime.msPerFrame) {
        setTimeout(SplitTime.main, SplitTime.msPerFrame - msElapsed);
        SplitTime.see.fillStyle="#00FF00";
    }
    else {
        setTimeout(SplitTime.main, 2); //give browser a quick breath
        var secondsElapsed = msElapsed/1000;
        displayFPS = Math.round(1/secondsElapsed);
        SplitTime.see.fillStyle="#FF0000";
    }

    SplitTime.Debug.update({
        "FPS": displayFPS,
        "Board Bodies": SplitTime.BoardRenderer.countBodies(),
        "Focus point": Math.round(SplitTime.BoardRenderer.getFocusPoint().x) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().y) + "," + Math.round(SplitTime.BoardRenderer.getFocusPoint().z),
        "Agents": agentCount,
        "HUD Layers": SplitTime.HUD.getRendererCount(),
        "Joystick Direction": SplitTime.Controls.JoyStick.getDirection()
    });
};

SplitTime.main.State = {
    LOADING: "loading",
    ACTION: "action",
    OVERWORLD: "overworld",
    OTHER: "other"
};

/**
 * @interface
 */
function FrameNotified() {}

FrameNotified.prototype.notifyFrameUpdate = function() {};