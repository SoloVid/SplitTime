//*-*-*-*-*-*-*-*-*-*-*-*Main Loop
SplitTime.main = function() {
	//console.log(SplitTime.counter);
	var startTime = new Date().getTime();
	var a = new Date(); //for speed checking
	switch(SplitTime.process)
	{
		case "hold": break;
		case "action":
		{
			//Advance one second per second (given 20ms SplitTime.main interval)
			if(SplitTime.counter%SplitTime.FPS === 0) SplitTime.Time.advance(1); //in time.js
			var b = new SLVD.speedCheck("SplitTime.Time.advance", a);
			b.logUnusual();

			SplitTime.zeldaPlayerMotion();
			var c = new SLVD.speedCheck("SplitTime.zeldaPlayerMotion", b.date);
			c.logUnusual();

			SplitTime.zeldaNPCMotion();
			var d = new SLVD.speedCheck("SplitTime.zeldaNPCMotion", c.date);
			d.logUnusual();

			if(SplitTime.onBoard.bodies.length === 0) SplitTime.onBoard.refetchBodies();
			else SplitTime.onBoard.sortBodies();
			var e = new SLVD.speedCheck("SplitTime sort board bodies", d.date);
			e.logUnusual();

			if(SplitTime.process != "action") break;

			//Render board, SplitTime.see below
			SplitTime.renderBoardState(true);
			var f = new SLVD.speedCheck("SplitTime.renderBoardState", e.date);
			f.logUnusual(5);

			break;
		}
		case "TRPG":
		{
			if(SplitTime.cTeam == SplitTime.player)
			{
				SplitTime.TRPGPlayerMotion();
			}
			else if(SplitTime.cTeam == boardNPC)
			{
				SplitTime.TRPGNPCMotion();
			}
			SplitTime.onBoard.sortBodies();

			SplitTime.renderBoardState(true);
			break;
		}
		case "menu":
		{
			//alert("start SplitTime.menu");
			SplitTime.currentMenu.handleMenu(); //in menuFunctions.js
			//alert("handled SplitTime.menu");
			SplitTime.currentMenu.update(); //in SplitTime.menu object declaration
			//alert("ran update check");
			//Draw SplitTime.menu background
			SplitTime.see.drawImage(SplitTime.currentMenu.background, 0, 0);
			//Draw cursor
			SplitTime.see.drawImage(SplitTime.currentMenu.cursor, SplitTime.currentMenu.point[SplitTime.currentMenu.currentPoint].x, SplitTime.currentMenu.point[SplitTime.currentMenu.currentPoint].y);
			if(SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space") //Select
			{
				SplitTime.currentMenu.chosenPoint = SplitTime.currentMenu.currentPoint;
				if(SplitTime.currentLevel)
				{
					SplitTime.process = SplitTime.currentLevel.type;
				}
				SplitTime.mainPromise.resolve(SplitTime.currentMenu.chosenPoint);
			}
			delete SplitTime.keyFirstDown;
			break;
		}
		case "delay":
		{
			if(SplitTime.countdown <= 0)
			{
				if(SplitTime.currentLevel)
				{
					SplitTime.process = SplitTime.currentLevel.type;
				}
				if(SplitTime.mainPromise)
				{
					SplitTime.mainPromise.resolve();
				}
			}
			else SplitTime.countdown--;
			break;
		}
		default: {}
	}
	SplitTime.counter++;
	if(SplitTime.counter == 25600)
	{
		SplitTime.counter = 0;
	}
	//	document.getElementById("timey").innerHTML = SplitTime.counter;
	if((SplitTime.counter%8) === 0)
	{
		SplitTime.frameClock = 1;
	}
	else
	{
		SplitTime.frameClock = 0;
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

//*-*-*-*-*-*-*-*-*-*-*-*End Main Loop


SplitTime.keyCodeKey = {
	65: 'a',
	83: 's',
	68: 'd',
	87: 'w',
	32: 'space',
	13: 'enter',
	37: 'left',
	40: 'down',
	39: 'right',
	38: 'up',
	74: 'j',
	75: 'k',
	76: 'l',
	73: 'i'
};

//Main (master) functions

//Set SplitTime.wX and SplitTime.wY (references for relative SplitTime.image drawing) based on current SplitTime.player's (or in some cases SplitTime.NPC's) position.
SplitTime.orientScreen = function() {
	var person = SplitTime.cTeam[SplitTime.currentPlayer];
	var x = person.x + person.offX;
	var y = person.y + person.offY;
  if(SplitTime.currentLevel.width <= SplitTime.SCREENX) {
	SplitTime.wX = (SplitTime.currentLevel.width - SplitTime.SCREENX)/2;
  }
  else if (x + SplitTime.SCREENX/2 >= SplitTime.currentLevel.width) {
    SplitTime.wX = SplitTime.currentLevel.width - SplitTime.SCREENX;
  }
  else if (x >= SplitTime.SCREENX/2) {
    SplitTime.wX = x - (SplitTime.SCREENX/2);
  }
  else {
    SplitTime.wX = 0;
  }

  if(SplitTime.currentLevel.height <= SplitTime.SCREENY) {
	SplitTime.wY = (SplitTime.currentLevel.height - SplitTime.SCREENY)/2;
  }
  else if (y + SplitTime.SCREENY/2 >= SplitTime.currentLevel.height) {
    SplitTime.wY = SplitTime.currentLevel.height - SplitTime.SCREENY;
  }
  else if (y >= SplitTime.SCREENY/2) {
    SplitTime.wY = y - (SplitTime.SCREENY/2);
  }
  else {
    SplitTime.wY = 0;
  }
};

//Based on keys down (ASDW and arrows), set current SplitTime.player's direction. Used in SplitTime.zeldaPlayerMotion().
SplitTime.figurePlayerDirection = function() {
	var dKeys = 0;
	var dir = 0;
	if(SplitTime.keyDown['a'] || SplitTime.keyDown['left']) //West
	{
		//How many directional keys down
		dKeys++;
		//Average in the new direction to the current direction
		dir = ((dir*(dKeys - 1)) + 2)/dKeys;
	}
	if(SplitTime.keyDown['w'] || SplitTime.keyDown['up']) //North
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 1)/dKeys;
	}
	if(SplitTime.keyDown['d'] || SplitTime.keyDown['right']) //East
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 0)/dKeys;
	}
	if(SplitTime.keyDown['s'] || SplitTime.keyDown['down']) //South
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 3)/dKeys;
	}
	if((SplitTime.keyDown['s'] || SplitTime.keyDown['down']) && (SplitTime.keyDown['d'] || SplitTime.keyDown['right'])) //Southeast
	{
		dir += 2;
	}

	if(dKeys)
	{
		SplitTime.player[SplitTime.currentPlayer].dir = dir % 4;
		return true;
	}
	return false;
};

SplitTime.renderBoardState = function(forceCalculate) {
	if(!forceCalculate)
	{
		SplitTime.see.drawImage(SplitTime.snapShot, 0, 0);
		return;
	}

	SplitTime.orientScreen();
	var lightedThing = [];
	var index, second;
	//Black out screen (mainly for the case of board being smaller than the screen)
	SplitTime.see.fillStyle="#000000";
	SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

	//Rendering sequence
	for(index = 0; index < SplitTime.currentLevel.layerImg.length; index++)
	{
		SplitTime.snapShotCtx.clearRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

		if(SplitTime.process == "TRPG")
		{
			//Draw blue range squares
			if(index == SplitTime.cTeam[SplitTime.currentPlayer].layer && SplitTime.cTeam[SplitTime.currentPlayer].squares)
			{
				for(second = 0; second < SplitTime.cTeam[SplitTime.currentPlayer].squares.length; second++)
				{
					SplitTime.see.fillStyle = "rgba(0, 100, 255, .5)";
					SplitTime.see.fillRect(SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
					//SplitTime.see.drawImage(SplitTime.Image.get("blueSquare.png"), 0, 0, 32, 32, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
				}
			}
		}

		//Loop through SplitTime.onBoard.bodies (to render)
		for(second = 0; second < SplitTime.onBoard.bodies.length; second++)
		{
			var cBody = SplitTime.onBoard.bodies[second];
			if(cBody.layer == index) //ensure proper layering
			{
				cBody.see(SplitTime.snapShotCtx);
				//BodyF.see.call(cBody, SplitTime.snapShotCtx);

				//Determine if SplitTime.onBoard.bodies is lighted
				if(cBody.isLight)
				{
					lightedThing[lightedThing.length] = cBody;
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
		var tImg = SplitTime.Image.get(SplitTime.currentLevel.layerImg[index]);
		//Note: this single call on a perform test is a huge percentage of CPU usage.
		SplitTime.snapShotCtx.drawImage(tImg, SplitTime.wX + xDif, SplitTime.wY + yDif, SplitTime.SCREENX - 2*xDif, SplitTime.SCREENY - 2*yDif, xDif, yDif, SplitTime.SCREENX - 2*xDif, SplitTime.SCREENY - 2*yDif);

		SplitTime.snapShotCtx.globalCompositeOperation = "source-over";

		SplitTime.see.drawImage(SplitTime.snapShot, 0, 0);
	}

	SplitTime.renderWeather(lightedThing);

	//Display current SplitTime.player stats
	SplitTime.see.fillStyle="#FFFFFF";
	SplitTime.see.font="12px Verdana";
	SplitTime.see.fillText(SplitTime.player[SplitTime.currentPlayer].name + ": " + SplitTime.player[SplitTime.currentPlayer].hp + " HP | " + SplitTime.player[SplitTime.currentPlayer].strg + " Strength | " + SplitTime.player[SplitTime.currentPlayer].spd + " Agility", 10, 20);

	SplitTime.Time.renderClock(SplitTime.see); //in time.js

	//Save screen into SplitTime.snapShot
	SplitTime.snapShotCtx.drawImage(SplitTime.seeB, 0, 0);
};

SplitTime.renderWeather = function(lightedThing) {
	//Weather
	if(SplitTime.weather.rain)
	{
		SplitTime.see.drawImage(SplitTime.Image.get("rain.png"), -((SplitTime.counter%100)/100)*SplitTime.SCREENX, ((SplitTime.counter%25)/25)*SplitTime.SCREENY - SplitTime.SCREENY);
	}
	if(SplitTime.weather.clouds)
	{
		SplitTime.see.drawImage(SplitTime.Image.get("stormClouds.png"), 2560 - SplitTime.counter%2560, 0, SplitTime.SCREENX, SplitTime.SCREENY, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
		SplitTime.see.drawImage(SplitTime.Image.get("stormClouds.png"), 0 - SplitTime.counter%2560, 0, SplitTime.SCREENX, SplitTime.SCREENY, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
	}
	if(SplitTime.weather.lightning > 0)
	{
		//SplitTime.weather.lightning is the number of lightning strikes per minute
		if(SLVD.randomInt(SplitTime.FPS*60) <= SplitTime.weather.lightning)
		{
			SplitTime.see.fillStyle = "rgba(255, 255, 255, .75)";
			SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
		}
	}
	//Light in dark
	if(SplitTime.weather.dark > 0)
	{
		//Transparentize SplitTime.buffer
		SplitTime.bufferCtx.clearRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);

		//Put lighted things on the SplitTime.buffer as white radial gradients with opaque centers and transparent edges
		for(index = 0; index < lightedThing.length; index++)
		{
			var xCoord = (lightedThing[index].x) - SplitTime.wX;
			var yCoord = (lightedThing[index].y) - SplitTime.wY;
			var grd = SplitTime.bufferCtx.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, 150);
			grd.addColorStop(0, "rgba(255, 255, 255, " + SplitTime.weather.dark + ")");
			grd.addColorStop(1, "rgba(255, 255, 255, 0)");
			SplitTime.bufferCtx.fillStyle = grd;
			SplitTime.bufferCtx.beginPath();
			SplitTime.bufferCtx.arc(xCoord, yCoord, 150, 2*Math.PI, false);
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
