SplitTime.main = function() {
	var clock = SplitTime.FrameStabilizer.getSimpleClock(1000);
	var startTime = new Date().getTime();

	// Black out screen
    SplitTime.see.fillStyle = "#000000";
    SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

    try {
        var a = new Date(); //for speed checking
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
                //Advance one second per second (given 20ms SplitTime.main interval)
                if(clock.isClockFrame()) SplitTime.Time.advance(1); //in time.js
                var b = new SLVD.speedCheck("SplitTime.Time.advance", a);
                b.logUnusual();

                var agents = SplitTime.Region.getCurrent().getAgents();
                for (var i = 0; i < agents.length; i++) {
                	try {
                		if(typeof agents[i].notifyFrameUpdate === "function") {
                            agents[i].notifyFrameUpdate();
                        }
                    } catch(ex) {
                		console.error(ex);
					}
				}

                var c = new SLVD.speedCheck("agents update", b.date);
                c.logUnusual();

                var currentLevel = SplitTime.Level.getCurrent();
                if(currentLevel.getBodies().length === 0) currentLevel.refetchBodies();
                else currentLevel.sortBodies();
                var e = new SLVD.speedCheck("SplitTime sort board bodies", c.date);
                e.logUnusual();

                if(SplitTime.process != "action") break;

                //Render board, SplitTime.see below
                SplitTime.BoardRenderer.renderBoardState(true);
                var f = new SLVD.speedCheck("SplitTime.renderBoardState", e.date);
                f.logUnusual(5);

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

	if(SplitTime.showFPS) {
		SplitTime.see.font="18px Verdana";
		SplitTime.see.fillText("FPS: " + displayFPS, SplitTime.SCREENX/2, SplitTime.SCREENY - 20);
	}
};

SplitTime.main.State = {
    LOADING: "loading",
    ACTION: "action",
    OTHER: "other"
};