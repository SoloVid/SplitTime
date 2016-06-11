//*-*-*-*-*-*-*-*-*-*-*-*Main Loop
SLVDE.main = function() {
//console.log(SLVDE.counter);
	var startTime = new Date().getTime();
	var a = new Date(); //for speed checking
	switch(SLVDE.process)
	{
		case "loading":
		{
			SLVDE.loadUpdate(); //in load.js
			break;
		}
		case "zelda":
		{
			//Advance one second per second (given 20ms SLVDE.main interval)
			if(SLVDE.counter%SLVDE.FPS === 0) SLVDE.Time.advance(1); //in time.js
			var b = new SLVD.speedCheck("SLVDE.Time.advance", a);
			b.logUnusual();

			SLVDE.zeldaPlayerMotion();
			var c = new SLVD.speedCheck("SLVDE.zeldaPlayerMotion", b.date);
			c.logUnusual();

			SLVDE.zeldaNPCMotion();
			var d = new SLVD.speedCheck("SLVDE.zeldaNPCMotion", c.date);
			d.logUnusual();

			if(SLVDE.boardBody.length === 0) SLVDE.restartBoardC();
			else SLVDE.sortBoardC();
			var e = new SLVD.speedCheck("SLVDE.sortBoardC", d.date);
			e.logUnusual();

			if(SLVDE.process != "zelda") break;

			//Render board, SLVDE.see below
			SLVDE.renderBoardState(true);
			var f = new SLVD.speedCheck("SLVDE.renderBoardState", e.date);
			f.logUnusual(5);

			break;
		}
		case "TRPG":
		{
			if(SLVDE.cTeam == SLVDE.player)
			{
				SLVDE.TRPGPlayerMotion();
			}
			else if(SLVDE.cTeam == boardNPC)
			{
				SLVDE.TRPGNPCMotion();
			}
			SLVDE.sortBoardC();

			SLVDE.renderBoardState(true);
			break;
		}
		case "menu":
		{
			//alert("start SLVDE.menu");
			SLVDE.currentMenu.handleMenu(); //in menuFunctions.js
			//alert("handled SLVDE.menu");
			SLVDE.currentMenu.update(); //in SLVDE.menu object declaration
			//alert("ran update check");
			//Draw SLVDE.menu background
			SLVDE.see.drawImage(SLVDE.currentMenu.background, 0, 0);
			//Draw cursor
			SLVDE.see.drawImage(SLVDE.currentMenu.cursor, SLVDE.currentMenu.point[SLVDE.currentMenu.currentPoint].x, SLVDE.currentMenu.point[SLVDE.currentMenu.currentPoint].y);
			if(SLVDE.keyFirstDown == "enter" || SLVDE.keyFirstDown == "space") //Select
			{
				SLVDE.currentMenu.chosenPoint = SLVDE.currentMenu.currentPoint;
				if(SLVDE.currentLevel)
				{
					SLVDE.process = SLVDE.currentLevel.type;
				}
				SLVDE.mainPromise.resolve(SLVDE.currentMenu.chosenPoint);
			}
			delete SLVDE.keyFirstDown;
			break;
		}
		case "delay":
		{
			if(SLVDE.countdown <= 0)
			{
				if(SLVDE.currentLevel)
				{
					SLVDE.process = SLVDE.currentLevel.type;
				}
				if(SLVDE.mainPromise)
				{
					SLVDE.mainPromise.resolve();
				}
			}
			else SLVDE.countdown--;
			break;
		}
		default: { }
	}
	SLVDE.counter++;
	if(SLVDE.counter == 25600)
	{
		SLVDE.counter = 0;
	}
//	document.getElementById("timey").innerHTML = SLVDE.counter;
	if((SLVDE.counter%8) === 0)
	{
		SLVDE.frameClock = 1;
	}
	else
	{
		SLVDE.frameClock = 0;
	}

	var endTime = new Date().getTime();
	var msElapsed = endTime - startTime;

	var displayFPS = SLVDE.FPS;
	if(msElapsed < SLVDE.msPerFrame) {
		setTimeout(SLVDE.main, SLVDE.msPerFrame - msElapsed);
		SLVDE.see.fillStyle="#00FF00";
	}
	else {
		setTimeout(SLVDE.main, 2); //give browser a quick breath
		var secondsElapsed = msElapsed/1000;
		displayFPS = Math.round(1/secondsElapsed);
		SLVDE.see.fillStyle="#FF0000";
	}

	if(SLVDE.showFPS) {
		SLVDE.see.font="18px Verdana";
		SLVDE.see.fillText("FPS: " + displayFPS, SLVDE.SCREENX/2, SLVDE.SCREENY - 20);
	}
};

//*-*-*-*-*-*-*-*-*-*-*-*End Main Loop


SLVDE.keyCodeKey = {
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
//Sets variables useful for determining what keys are down at any time.
document.onkeydown = function(e) {
	//Prevent scrolling with arrows
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }

	var key = SLVDE.keyCodeKey[e.which || e.keyCode];//e.key.toLowerCase();

	if(key == " ")
	{
		key = "space";
	}
	//alert(key);

	if(key == "t")
	{
		alert("saving...");
		//alert("test second alert");
		SLVDE.fileSave("testFile");
		alert("saved!");
	}
	else if(key == "y")
	{
	/*	var seen = [];

		var alerter = JSON.stringify(SLVDE.player[SLVDE.currentPlayer], function(key, val) {
			if(val != null && typeof val == "object") {
				if(seen.indexOf(val) >= 0) return seen.push(val); }
				return val; });
		alert(alerter);*/
		alert(SLVDE.player[SLVDE.currentPlayer].x + ", " + SLVDE.player[SLVDE.currentPlayer].y + ", " + SLVDE.player[SLVDE.currentPlayer].layer);
	}

	if(SLVDE.keyDown[key] === undefined)
	{
		SLVDE.keyFirstDown = key;
	}
	SLVDE.keyDown[key] = true;

	if(SLVDE.process == "wait" && SLVDE.mainPromise)
	{
		if(SLVDE.currentLevel)
		{
			SLVDE.process = SLVDE.currentLevel.type;
		}
		SLVDE.mainPromise.resolve(key);
	}
	else if(SLVDE.process == "waitForEnterOrSpace" && (SLVDE.keyFirstDown == "enter" || SLVDE.keyFirstDown == "space"))
	{
		delete SLVDE.keyFirstDown;

		if(SLVDE.currentLevel)
		{
			SLVDE.process = SLVDE.currentLevel.type;
		}
		SLVDE.mainPromise.resolve(key);
	}
};

//The clean-up of the above function.
document.onkeyup = function(e) {
	var key = SLVDE.keyCodeKey[e.keyCode];//e.key.toLowerCase();

	if(key == SLVDE.keyFirstDown)
	{
		delete SLVDE.keyFirstDown;
	}

	delete SLVDE.keyDown[key];
};

//Set SLVDE.wX and SLVDE.wY (references for relative SLVDE.image drawing) based on current SLVDE.player's (or in some cases SLVDE.NPC's) position.
SLVDE.orientScreen = function() {
	var person = SLVDE.cTeam[SLVDE.currentPlayer];
	var x = person.x + person.offX;
	var y = person.y + person.offY;
  if(SLVDE.currentLevel.width <= SLVDE.SCREENX) {
	SLVDE.wX = (SLVDE.currentLevel.width - SLVDE.SCREENX)/2;
  }
  else if (x + SLVDE.SCREENX/2 >= SLVDE.currentLevel.width) {
    SLVDE.wX = SLVDE.currentLevel.width - SLVDE.SCREENX;
  }
  else if (x >= SLVDE.SCREENX/2) {
    SLVDE.wX = x - (SLVDE.SCREENX/2);
  }
  else {
    SLVDE.wX = 0;
  }

  if(SLVDE.currentLevel.height <= SLVDE.SCREENY) {
	SLVDE.wY = (SLVDE.currentLevel.height - SLVDE.SCREENY)/2;
  }
  else if (y + SLVDE.SCREENY/2 >= SLVDE.currentLevel.height) {
    SLVDE.wY = SLVDE.currentLevel.height - SLVDE.SCREENY;
  }
  else if (y >= SLVDE.SCREENY/2) {
    SLVDE.wY = y - (SLVDE.SCREENY/2);
  }
  else {
    SLVDE.wY = 0;
  }
};

//Sort all board characters into the array SLVDE.boardBody in order of y location (in order to properly render sprite overlap).
SLVDE.restartBoardC = function() {
	SLVDE.boardBody.length = 0;
	var index;
	//Figure out which NPCs are onboard
	for(index = 0; index < SLVDE.NPC.length; index++)
	{
		if(SLVDE.NPC[index].lvl == SLVDE.currentLevel.name)
		{
			SLVDE.insertBoardC(SLVDE.NPC[index]);
		}
	}

	//Pull board objects from file
	for(index = 0; index < SLVDE.currentLevel.filedata.getElementsByTagName("prop").length; index++)
	{
		var template = SLVDE.currentLevel.filedata.getElementsByTagName("prop")[index].getAttribute("template");
		var objCode = SLVDE.currentLevel.filedata.getElementsByTagName("prop")[index].textContent;

		SLVDE.insertBoardC(SLVDE.evalObj(template, objCode));
		//prop[current].lvl = SLVDE.currentLevel.name;
	}

	for(index = 0; index < SLVDE.player.length; index++)
	{
		if(index == SLVDE.currentPlayer || SLVDE.currentLevel.type == "TRPG") SLVDE.insertBoardC(SLVDE.player[index]);
	}
};

//Sort the array SLVDE.boardBody in order of y location (in order to properly render sprite overlap).
SLVDE.sortBoardC = function() {
	if(SLVDE.boardBody.length === 0) SLVDE.restartBoardC();
	else
	{
		for(var index = 1; index < SLVDE.boardBody.length; index++)
		{
			var second = index;
			while(second > 0 && SLVDE.boardBody[second].y < SLVDE.boardBody[second - 1].y)
			{
				var tempC = SLVDE.boardBody[second];
				SLVDE.boardBody[second] = SLVDE.boardBody[second - 1];
				SLVDE.boardBody[second - 1] = tempC;
				second--;
			}
		}
	}
};

SLVDE.insertBoardC = function(element) {
	var index = 0;
	while(index < SLVDE.boardBody.length && element.y > SLVDE.boardBody[index].y)
	{
		index++;
	}
	SLVDE.boardBody.splice(index, 0, element);
/*	var second = SLVDE.boardBody.length;
	SLVDE.boardBody[second] = element;
	while(second > 0)
	{
		if(SLVDE.boardBody[second].y < SLVDE.boardBody[second - 1].y)
		{
			var tempC = SLVDE.boardBody[second];
			SLVDE.boardBody[second] = SLVDE.boardBody[second - 1];
			SLVDE.boardBody[second - 1] = tempC;
		}
		second--;
	}*/
};

SLVDE.deleteBoardC = function(element) {
	for(var index = 0; index < SLVDE.boardBody.length; index++)
	{
		if(element == SLVDE.boardBody[index])
		{
			SLVDE.boardBody.splice(index, 1);
			index = SLVDE.boardBody.length;
		}
	}
};

//Based on keys down (ASDW and arrows), set current SLVDE.player's direction. Used in SLVDE.zeldaPlayerMotion().
SLVDE.figurePlayerDirection = function() {
	var dKeys = 0;
	var dir = 0;
	if(SLVDE.keyDown['a'] || SLVDE.keyDown['left']) //West
	{
		//How many directional keys down
		dKeys++;
		//Average in the new direction to the current direction
		dir = ((dir*(dKeys - 1)) + 2)/dKeys;
	}
	if(SLVDE.keyDown['w'] || SLVDE.keyDown['up']) //North
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 1)/dKeys;
	}
	if(SLVDE.keyDown['d'] || SLVDE.keyDown['right']) //East
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 0)/dKeys;
	}
	if(SLVDE.keyDown['s'] || SLVDE.keyDown['down']) //South
	{
		dKeys++;
		dir = ((dir*(dKeys - 1)) + 3)/dKeys;
	}
	if((SLVDE.keyDown['s'] || SLVDE.keyDown['down']) && (SLVDE.keyDown['d'] || SLVDE.keyDown['right'])) //Southeast
	{
		dir += 2;
	}

	if(dKeys)
	{
		SLVDE.player[SLVDE.currentPlayer].dir = dir % 4;
		return true;
	}
	return false;
};

SLVDE.renderBoardState = function(forceCalculate) {
	if(!forceCalculate)
	{
		SLVDE.see.drawImage(SLVDE.snapShot, 0, 0);
		return;
	}

	SLVDE.orientScreen();
	var lightedThing = [];
	var index, second;
	//Black out screen (mainly for the case of board being smaller than the screen)
	SLVDE.see.fillStyle="#000000";
	SLVDE.see.fillRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);

	//Rendering sequence
	for(index = 0; index < SLVDE.currentLevel.layerImg.length; index++)
	{
		SLVDE.snapShotCtx.clearRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);

		if(SLVDE.process == "TRPG")
		{
			//Draw blue range squares
			if(index == SLVDE.cTeam[SLVDE.currentPlayer].layer && SLVDE.cTeam[SLVDE.currentPlayer].squares)
			{
				for(second = 0; second < SLVDE.cTeam[SLVDE.currentPlayer].squares.length; second++)
				{
					SLVDE.see.fillStyle = "rgba(0, 100, 255, .5)";
					SLVDE.see.fillRect(SLVDE.cTeam[SLVDE.currentPlayer].squares[second].x*32 - SLVDE.wX, SLVDE.cTeam[SLVDE.currentPlayer].squares[second].y*32 - SLVDE.wY, 32, 32);
					//SLVDE.see.drawImage(SLVDE.image["blueSquare.png"], 0, 0, 32, 32, SLVDE.cTeam[SLVDE.currentPlayer].squares[second].x*32 - SLVDE.wX, SLVDE.cTeam[SLVDE.currentPlayer].squares[second].y*32 - SLVDE.wY, 32, 32);
				}
			}
		}

		//Loop through SLVDE.boardBody (to render)
		for(second = 0; second < SLVDE.boardBody.length; second++)
		{
			var cBody = SLVDE.boardBody[second];
			if(cBody.layer == index) //ensure proper layering
			{
				cBody.see(SLVDE.snapShotCtx);
				//BodyF.see.call(cBody, SLVDE.snapShotCtx);

				//Determine if SLVDE.boardBody is lighted
				if(cBody.isLight)
				{
					lightedThing[lightedThing.length] = cBody;
				}

				cBody.resetStance();
				cBody.resetCans();
			}
		}
		SLVDE.snapShotCtx.globalAlpha = 1;

		//Work out details of smaller-than-screen dimensions
		var xDif, yDif;
		if(SLVDE.wX < 0) xDif = Math.abs(SLVDE.wX);
		else xDif = 0;
		if(SLVDE.wY < 0) yDif = Math.abs(SLVDE.wY);
		else yDif = 0;

		SLVDE.snapShotCtx.globalCompositeOperation = "destination-over";

		//Draw layer based on values found in SLVDE.orientScreen() and altered above
		var tImg = SLVDE.getImage(SLVDE.currentLevel.layerImg[index]);
		//Note: this single call on a perform test is a huge percentage of CPU usage.
		SLVDE.snapShotCtx.drawImage(tImg, SLVDE.wX + xDif, SLVDE.wY + yDif, SLVDE.SCREENX - 2*xDif, SLVDE.SCREENY - 2*yDif, xDif, yDif, SLVDE.SCREENX - 2*xDif, SLVDE.SCREENY - 2*yDif);

		SLVDE.snapShotCtx.globalCompositeOperation = "source-over";

		SLVDE.see.drawImage(SLVDE.snapShot, 0, 0);
	}

	SLVDE.renderWeather(lightedThing);

	//Display current SLVDE.player stats
	SLVDE.see.fillStyle="#FFFFFF";
	SLVDE.see.font="12px Verdana";
	SLVDE.see.fillText(SLVDE.player[SLVDE.currentPlayer].name + ": " + SLVDE.player[SLVDE.currentPlayer].hp + " HP | " + SLVDE.player[SLVDE.currentPlayer].strg + " Strength | " + SLVDE.player[SLVDE.currentPlayer].spd + " Agility", 10, 20);

	SLVDE.Time.renderClock(SLVDE.see); //in time.js

	//Save screen into SLVDE.snapShot
	SLVDE.snapShotCtx.drawImage(SLVDE.seeB, 0, 0);
};

SLVDE.renderWeather = function(lightedThing) {
	//Weather
	if(SLVDE.weather.rain)
	{
		SLVDE.see.drawImage(SLVDE.image["rain.png"], -((SLVDE.counter%100)/100)*SLVDE.SCREENX, ((SLVDE.counter%25)/25)*SLVDE.SCREENY - SLVDE.SCREENY);
	}
	if(SLVDE.weather.clouds)
	{
		SLVDE.see.drawImage(SLVDE.image["stormClouds.png"], 2560 - SLVDE.counter%2560, 0, SLVDE.SCREENX, SLVDE.SCREENY, 0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
		SLVDE.see.drawImage(SLVDE.image["stormClouds.png"], 0 - SLVDE.counter%2560, 0, SLVDE.SCREENX, SLVDE.SCREENY, 0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
	}
	if(SLVDE.weather.lightning > 0)
	{
		//SLVDE.weather.lightning is the number of lightning strikes per minute
		if(SLVD.randomInt(SLVDE.FPS*60) <= SLVDE.weather.lightning)
		{
			SLVDE.see.fillStyle = "rgba(255, 255, 255, .75)";
			SLVDE.see.fillRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
		}
	}
	//Light in dark
	if(SLVDE.weather.dark > 0)
	{
		//Transparentize SLVDE.buffer
		SLVDE.bufferCtx.clearRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);

		//Put lighted things on the SLVDE.buffer as white radial gradients with opaque centers and transparent edges
		for(index = 0; index < lightedThing.length; index++)
		{
			var xCoord = (lightedThing[index].x) - SLVDE.wX;
			var yCoord = (lightedThing[index].y) - SLVDE.wY;
			var grd = SLVDE.bufferCtx.createRadialGradient(xCoord, yCoord, 1, xCoord, yCoord, 150);
			grd.addColorStop(0, "rgba(255, 255, 255, " + SLVDE.weather.dark + ")");
			grd.addColorStop(1, "rgba(255, 255, 255, 0)");
			SLVDE.bufferCtx.fillStyle = grd;
			SLVDE.bufferCtx.beginPath();
			SLVDE.bufferCtx.arc(xCoord, yCoord, 150, 2*Math.PI, false);
			SLVDE.bufferCtx.closePath();
			SLVDE.bufferCtx.fill();
		}

		//XOR lights placed with black overlay (the result being holes in the black)
		SLVDE.bufferCtx.globalCompositeOperation = "xor";
		SLVDE.bufferCtx.fillStyle = "rgba(0, 0, 0, " + SLVDE.weather.dark + ")";//"#000000";
		SLVDE.bufferCtx.fillRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);

		//Render SLVDE.buffer
		SLVDE.see.drawImage(SLVDE.buffer, 0, 0, SLVDE.SCREENX, SLVDE.SCREENY);

		//Return to default SLVDE.image layering
		SLVDE.bufferCtx.globalCompositeOperation = "source-over";
	}
};
