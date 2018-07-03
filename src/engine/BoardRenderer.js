SplitTime.BoardRenderer = {};

(function() {
	var COUNTER_BASE = 25600;
	var frameStabilizer = new SplitTime.FrameStabilizer(SplitTime.msPerFrame, COUNTER_BASE);

	//Set SplitTime.wX and SplitTime.wY (references for relative SplitTime.image drawing) based on current SplitTime.player's (or in some cases SplitTime.NPC's) position.
    SplitTime.BoardRenderer.orientScreen = function() {
        var currentLevel = SplitTime.Level.getCurrent();
        // TODO: figure out how to obtain focused body
        var person = SplitTime.cTeam[SplitTime.currentPlayer];
        var x = person.x + person.offX;
        var y = person.y + person.offY;
        if(currentLevel.width <= SplitTime.SCREENX) {
            SplitTime.wX = (currentLevel.width - SplitTime.SCREENX) / 2;
        }
        else if(x + SplitTime.SCREENX / 2 >= currentLevel.width) {
            SplitTime.wX = currentLevel.width - SplitTime.SCREENX;
        }
        else if(x >= SplitTime.SCREENX / 2) {
            SplitTime.wX = x - (SplitTime.SCREENX / 2);
        }
        else {
            SplitTime.wX = 0;
        }

        if(currentLevel.height <= SplitTime.SCREENY) {
            SplitTime.wY = (currentLevel.height - SplitTime.SCREENY) / 2;
        }
        else if(y + SplitTime.SCREENY / 2 >= currentLevel.height) {
            SplitTime.wY = currentLevel.height - SplitTime.SCREENY;
        }
        else if(y >= SplitTime.SCREENY / 2) {
            SplitTime.wY = y - (SplitTime.SCREENY / 2);
        }
        else {
            SplitTime.wY = 0;
        }
    };

    SplitTime.BoardRenderer.renderBoardState = function(forceCalculate) {
        if(!forceCalculate) {
            SplitTime.see.drawImage(SplitTime.snapShot, 0, 0);
            return;
        }
        var currentLevel = SplitTime.Level.getCurrent();
        SplitTime.orientScreen();
        var lightedThings = [];
        //Black out screen (mainly for the case of board being smaller than the screen)
        SplitTime.see.fillStyle = "#000000";
        SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

        //Rendering sequence
        for(var layer = 0; layer < currentLevel.layerImg.length; layer++) {
            SplitTime.snapShotCtx.clearRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

            // if(SplitTime.process == "TRPG")
            // {
            // 	//Draw blue range squares
            // 	if(index == SplitTime.cTeam[SplitTime.currentPlayer].z && SplitTime.cTeam[SplitTime.currentPlayer].squares)
            // 	{
            // 		for(second = 0; second < SplitTime.cTeam[SplitTime.currentPlayer].squares.length; second++)
            // 		{
            // 			SplitTime.see.fillStyle = "rgba(0, 100, 255, .5)";
            // 			SplitTime.see.fillRect(SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
            // 			//SplitTime.see.drawImage(SplitTime.Image.get("blueSquare.png"), 0, 0, 32, 32, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
            // 		}
            // 	}
            // }

            var bodies = currentLevel.getBodies();

            //Loop through SplitTime.onBoard.bodies (to render)
            for(var iBody = 0; iBody < bodies.length; iBody++) {
                var cBody = bodies[iBody];
                if(cBody.z == layer) //ensure proper layering
                {
                    cBody.see(SplitTime.snapShotCtx);
                    //BodyF.see.call(cBody, SplitTime.snapShotCtx);

                    //Determine if SplitTime.onBoard.bodies is lighted
                    if(cBody.isLight) {
                        lightedThings.push(cBody);
                    }

                    cBody.resetStance();
                    cBody.resetCans();
                }
            }
            SplitTime.snapShotCtx.globalAlpha = 1;

            //Work out details of smaller-than-screen dimensions
            var xDif, yDif;
            if(SplitTime.wX < 0) xDif = Math.abs(SplitTime.wX);
            else xDif = 0;
            if(SplitTime.wY < 0) yDif = Math.abs(SplitTime.wY);
            else yDif = 0;

            SplitTime.snapShotCtx.globalCompositeOperation = "destination-over";

            //Draw layer based on values found in SplitTime.orientScreen() and altered above
            var tImg = SplitTime.Image.get(currentLevel.layerImg[layer]);
            //Note: this single call on a perform test is a huge percentage of CPU usage.
            SplitTime.snapShotCtx.drawImage(tImg, SplitTime.wX + xDif, SplitTime.wY + yDif, SplitTime.SCREENX - 2 * xDif, SplitTime.SCREENY - 2 * yDif, xDif, yDif, SplitTime.SCREENX - 2 * xDif, SplitTime.SCREENY - 2 * yDif);

            SplitTime.snapShotCtx.globalCompositeOperation = "source-over";

            SplitTime.see.drawImage(SplitTime.snapShot, 0, 0);
        }

        SplitTime.renderWeather(lightedThings);

        //Display current SplitTime.player stats
        // SplitTime.see.fillStyle="#FFFFFF";
        // SplitTime.see.font="12px Verdana";
        // SplitTime.see.fillText(SplitTime.player[SplitTime.currentPlayer].name + ": " + SplitTime.player[SplitTime.currentPlayer].hp + " HP | " + SplitTime.player[SplitTime.currentPlayer].strg + " Strength | " + SplitTime.player[SplitTime.currentPlayer].spd + " Agility", 10, 20);
        //
        // SplitTime.Time.renderClock(SplitTime.see); //in time.js

        //Save screen into SplitTime.snapShot
        SplitTime.snapShotCtx.drawImage(SplitTime.seeB, 0, 0);
    };

    SplitTime.BoardRenderer.renderWeather = function(lightedThings) {
    	var counter = frameStabilizer.getCounter();
        //Weather
        if(SplitTime.weather.rain) {
            SplitTime.see.drawImage(SplitTime.Image.get("rain.png"), -((counter % 100) / 100) * SplitTime.SCREENX, ((counter % 25) / 25) * SplitTime.SCREENY - SplitTime.SCREENY);
        }
        if(SplitTime.weather.clouds) {
            SplitTime.see.drawImage(SplitTime.Image.get("stormClouds.png"), 2560 - counter % 2560, 0, SplitTime.SCREENX, SplitTime.SCREENY, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
            SplitTime.see.drawImage(SplitTime.Image.get("stormClouds.png"), 0 - counter % 2560, 0, SplitTime.SCREENX, SplitTime.SCREENY, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
        }
        if(SplitTime.weather.lightning > 0) {
            //SplitTime.weather.lightning is the number of lightning strikes per minute
            if(SLVD.randomInt(SplitTime.FPS * 60) <= SplitTime.weather.lightning) {
                SplitTime.see.fillStyle = "rgba(255, 255, 255, .75)";
                SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
            }
        }
        //Light in dark
        if(SplitTime.weather.dark > 0) {
            //Transparentize SplitTime.buffer
            SplitTime.bufferCtx.clearRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

            //Put lighted things on the SplitTime.buffer as white radial gradients with opaque centers and transparent edges
            for(var iLight = 0; iLight < lightedThings.length; iLight++) {
                var xCoord = (lightedThings[iLight].x) - SplitTime.wX;
                var yCoord = (lightedThings[iLight].y) - SplitTime.wY;
                var grd = SplitTime.bufferCtx.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, 150);
                grd.addColorStop(0, "rgba(255, 255, 255, " + SplitTime.weather.dark + ")");
                grd.addColorStop(1, "rgba(255, 255, 255, 0)");
                SplitTime.bufferCtx.fillStyle = grd;
                SplitTime.bufferCtx.beginPath();
                SplitTime.bufferCtx.arc(xCoord, yCoord, 150, 2 * Math.PI, false);
                SplitTime.bufferCtx.closePath();
                SplitTime.bufferCtx.fill();
            }

            //XOR lights placed with black overlay (the result being holes in the black)
            SplitTime.bufferCtx.globalCompositeOperation = "xor";
            SplitTime.bufferCtx.fillStyle = "rgba(0, 0, 0, " + SplitTime.weather.dark + ")";//"#000000";
            SplitTime.bufferCtx.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

            //Render SplitTime.buffer
            SplitTime.see.drawImage(SplitTime.buffer, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

            //Return to default SplitTime.image layering
            SplitTime.bufferCtx.globalCompositeOperation = "source-over";
        }
    };
} ());