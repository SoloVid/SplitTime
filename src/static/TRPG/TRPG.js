			/*SLVDE.orientScreen();
			for(var index = 0; index < SLVDE.currentLevel.layerImg.length; index++)
			{
				//Draw layer
				SLVDE.see.drawImage(SLVDE.currentLevel.layerImg[index], SLVDE.wX, SLVDE.wY, SLVDE.SCREENX, SLVDE.SCREENY, 0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
				//Draw blue range squares
				if(index == SLVDE.cTeam[SLVDE.currentPlayer].layer && SLVDE.cTeam[SLVDE.currentPlayer].squares != null)
				{
					for(var second = 0; second < SLVDE.cTeam[SLVDE.currentPlayer].squares.length; second++)
					{
						SLVDE.see.drawImage(SLVDE.image["blueSquare.png"], 0, 0, 32, 32, SLVDE.cTeam[SLVDE.currentPlayer].squares[second].x*32 - SLVDE.wX, SLVDE.cTeam[SLVDE.currentPlayer].squares[second].y*32 - SLVDE.wY, 32, 32);
					}
				}
				for(var second = 0; second < SLVDE.boardSprite.length; second++)
				{
					if(SLVDE.boardSprite[second].act == "slash")
					{
						//If done slashing, move on.
						if(SLVDE.boardSprite[second].SLVDE.countdown <= 0)
						{
							SLVDE.boardSprite[second].act = null;
							SLVDE.TRPGNextTurn();
						}
						else
						{
							//Cycle through opponents
							for(var third = 0; third < SLVDE.boardSprite[second].oppTeam.length; third++)
							{
								//If distance < 40
								//if(Math.sqrt(Math.pow(SLVDE.boardSprite[second].oppTeam[third].x - SLVDE.boardSprite[second].x, 2) + Math.pow(SLVDE.boardSprite[second].oppTeam[third].y - SLVDE.boardSprite[second].y, 2)) <= 36)
								//If one tile away
								if(Math.pow(SLVDE.xPixToTile(SLVDE.boardSprite[second].oppTeam[third].x) - SLVDE.xPixToTile(SLVDE.boardSprite[second].x), 2) + Math.pow(SLVDE.yPixToTile(SLVDE.boardSprite[second].oppTeam[third].y) - SLVDE.yPixToTile(SLVDE.boardSprite[second].y), 2) == 1)
								{
									//Determine angle between slasher and opponent (in terms of PI/2)
									var angle = Math.atan(-(SLVDE.boardSprite[second].oppTeam[third].y - SLVDE.boardSprite[second].y)/(SLVDE.boardSprite[second].oppTeam[third].x - SLVDE.boardSprite[second].x))/(Math.PI/2);

									if(SLVDE.boardSprite[second].oppTeam[third].x > SLVDE.boardSprite[second].x && SLVDE.boardSprite[second].oppTeam[third].y > SLVDE.boardSprite[second].y)
									{
										angle += 4;
									}
									else if(SLVDE.boardSprite[second].oppTeam[third].x < SLVDE.boardSprite[second].x)
									{
										angle += 2;
									}
									//Compare angle to direction of slasher. If in range of PI...
									if((Math.abs(angle - SLVDE.boardSprite[second].dir) <= .5 || Math.abs(angle - SLVDE.boardSprite[second].dir) >= 3.5) && SLVDE.boardSprite[second].oppTeam[third].status != "hurt")
									{
										SLVDE.damage(SLVDE.boardSprite[second], SLVDE.boardSprite[second].oppTeam[third]);
										SLVDE.boardSprite[second].oppTeam[third].status = "hurt";
										SLVDE.boardSprite[second].oppTeam[third].SLVDE.countdown = 4;
									}
								}
							}
							SLVDE.see.lineWidth = 8;
							SLVDE.see.beginPath();
							SLVDE.see.arc((SLVDE.boardSprite[second].x - ((SLVDE.boardSprite[second].xres)/2)) - SLVDE.wX + 24, (SLVDE.boardSprite[second].y - (SLVDE.boardSprite[second].yres)) - SLVDE.wY + 56, 32, .5*((3 - SLVDE.boardSprite[second].dir) - .5 + (SLVDE.boardSprite[second].SLVDE.countdown/8))*Math.PI, .5*((3 - SLVDE.boardSprite[second].dir) + .5 + (SLVDE.boardSprite[second].SLVDE.countdown/8))*Math.PI);
							SLVDE.see.strokeStyle = "white";
							SLVDE.see.stroke();
							SLVDE.boardSprite[second].SLVDE.countdown--;
							if(SLVDE.boardSprite[second].SLVDE.countdown < 0)
							{
								SLVDE.boardSprite[second].SLVDE.countdown = 0;
							}
						}
					}
					if(SLVDE.boardSprite[second].layer == index)
					{
						if((SLVDE.boardSprite[second].status == "hurt" && SLVDE.frameClock != 1) || SLVDE.boardSprite[second].status != "hurt")
						{
							var col = SLVDE.determineColumn(SLVDE.boardSprite[second].dir);
							SLVDE.see.drawImage(SLVDE.boardSprite[second].img, 32*col, 64*SLVDE.boardSprite[second].frame, SLVDE.boardSprite[second].xres, SLVDE.boardSprite[second].yres, (SLVDE.boardSprite[second].x - (((SLVDE.boardSprite[second].xres)/2) - 8)) - SLVDE.wX, (SLVDE.boardSprite[second].y - (SLVDE.boardSprite[second].yres - 8)) - SLVDE.wY, SLVDE.boardSprite[second].xres, SLVDE.boardSprite[second].yres);
							if(SLVDE.boardSprite[second].holding != null && Math.round(SLVDE.boardSprite[second].dir) != 1)
							{
								SLVDE.see.drawImage(SLVDE.boardSprite[second].holding, (SLVDE.boardSprite[second].holding.width/4)*col, 0, (SLVDE.boardSprite[second].holding.width/4), 32, (SLVDE.boardSprite[second].x - (((SLVDE.boardSprite[second].xres)/2) - 8)) - SLVDE.wX + 16*Math.round(Math.cos(SLVDE.boardSprite[second].dir*Math.PI/2)), (SLVDE.boardSprite[second].y - (SLVDE.boardSprite[second].yres - 18)) - SLVDE.wY - 5*Math.round(Math.sin(SLVDE.boardSprite[second].dir*Math.PI/2)), 32, 32);
							}
						}
						if(SLVDE.boardSprite[second].status == "hurt" && SLVDE.frameClock == 1)
						{
								SLVDE.boardSprite[second].SLVDE.countdown--;
								if(SLVDE.boardSprite[second].SLVDE.countdown <= 0)
								{
									SLVDE.boardSprite[second].status = null;
								}
						}
					}
					if(SLVDE.boardSprite[second].dart.layer == index)
					{
						var col = SLVDE.determineColumn(SLVDE.boardSprite[second].dart.dir);
						SLVDE.see.drawImage(SLVDE.boardSprite[second].dart.img, SLVDE.boardSprite[second].dart.xres*col, SLVDE.boardSprite[second].dart.yres*SLVDE.boardSprite[second].dart.frame, SLVDE.boardSprite[second].dart.xres, SLVDE.boardSprite[second].dart.yres, SLVDE.boardSprite[second].dart.x - SLVDE.wX, SLVDE.boardSprite[second].dart.y - SLVDE.wY, SLVDE.boardSprite[second].dart.xres, SLVDE.boardSprite[second].dart.yres);
					}
				}
			}
			//Weather
			SLVDE.see.fillStyle = "rgba(0, 0, 0, " + shade + ")";
			SLVDE.see.fillRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
			if(rainy)
			{
				SLVDE.see.drawImage(SLVDE.image["rain.png"], -((SLVDE.counter%100)/100)*SLVDE.SCREENX, ((SLVDE.counter%25)/25)*SLVDE.SCREENY - SLVDE.SCREENY);
				if(SLVDE.counter%8 == SLVD.randomInt(12))
				{
					for(var index = 0; index < SLVD.randomInt(3); index++)
					{
						SLVDE.see.drawImage(SLVDE.image["lightning.png"], 0, 0);
					}
				}
			}
			if(cloudy) SLVDE.see.drawImage(SLVDE.image["stormClouds.png"], SLVDE.counter%1280 - 1280, 0);
			//document.getElementById("info").innerHTML = SLVDE.player[0].dir + ", " + SLVDE.player[0].x + ", " + SLVDE.player[0].y + ", " + dKeys
			SLVDE.see.fillStyle="#FFFFFF";
			SLVDE.see.font="12px Verdana";
			SLVDE.see.fillText(SLVDE.cTeam[SLVDE.currentPlayer].name + ": " + SLVDE.cTeam[SLVDE.currentPlayer].hp + " HP | " + SLVDE.cTeam[SLVDE.currentPlayer].strg + " Strength | " + SLVDE.cTeam[SLVDE.currentPlayer].spd + " Speed", 10, 20);
			*/

SLVDE.TRPGNextTurn = function() //Function run at the end of a character's turn in TRPG mode. Most notably sets SLVDE.cTeam and SLVDE.currentPlayer.
{
	if(SLVDE.currentPlayer >= 0)
	{
		SLVDE.cTeam[SLVDE.currentPlayer].dir = 3;
		SLVDE.PF.reformUnitsOnSquareWithout(SLVDE.xPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].x), SLVDE.yPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].y), SLVDE.cTeam, 0);
	}
	if(SLVDE.cTeam[SLVDE.currentPlayer])
	{
		delete SLVDE.cTeam[SLVDE.currentPlayer].squares;
		delete SLVDE.cTeam[SLVDE.currentPlayer].target;
	}
	if(SLVDE.currentPlayer < SLVDE.cTeam.length - 1)
	{
		SLVDE.currentPlayer++;
	}
	else if(SLVDE.cTeam[SLVDE.currentPlayer].oppTeam.length !== 0)
	{
		SLVDE.cTeam = SLVDE.cTeam[SLVDE.currentPlayer].oppTeam;
		SLVDE.currentPlayer = 0;

		if(SLVDE.cTeam == SLVDE.player)
		{
			SLVDE.Time.advance(12*60*60); //in time.js
		}
	}
	else
	{
		resumeFunc = die;
		resumeCue = resumeFunc(2);
		SLVDE.currentPlayer = 0;
	}
	//alert(SLVDE.cTeam[SLVDE.currentPlayer].name + SLVDE.currentPlayer);
	SLVDE.cTeam[SLVDE.currentPlayer].ix = SLVDE.cTeam[SLVDE.currentPlayer].x;
	SLVDE.cTeam[SLVDE.currentPlayer].iy = SLVDE.cTeam[SLVDE.currentPlayer].y;

	SLVDE.PF.reformUnitsOnSquareWithout(SLVDE.xPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].x), SLVDE.yPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].y), SLVDE.cTeam, SLVDE.cTeam[SLVDE.currentPlayer]);
	SLVDE.cTeam[SLVDE.currentPlayer].x = SLVDE.xTileToPix(SLVDE.xPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].x));
	SLVDE.cTeam[SLVDE.currentPlayer].y = SLVDE.yTileToPix(SLVDE.yPixToTile(SLVDE.cTeam[SLVDE.currentPlayer].y));
/*	SLVDE.process = "wait";
	SLVDE.countdown = 8;*/
};

SLVDE.TRPGNPCMotion = function() //Function for a single SLVDE.NPC whose turn it is in TRPG mode.
{
	if(boardNPC[SLVDE.currentPlayer].dmnr != 2) //If SLVDE.NPC is non-aggressive (such as one for talking to), just move on to next SLVDE.NPC without moving.
	{
		SLVDE.TRPGNextTurn();
	}
	else
	{
		if(boardNPC[SLVDE.currentPlayer].target == -1) //If no path could be found to a target, end turn.
		{
			SLVDE.TRPGNextTurn();
		}
		else if(boardNPC[SLVDE.currentPlayer].path.x.length > 0) //If path is set up, follow path. TODO: check modification of this if for JSHint
		{
			if(SLVDE.counter%4 === 0) { boardNPC[SLVDE.currentPlayer].frame = (boardNPC[SLVDE.currentPlayer].frame + 1)%4; }
			pathMotion(boardNPC[SLVDE.currentPlayer], 8);
		}
		else if(!boardNPC[SLVDE.currentPlayer].target) //If no target (or -1 as "target"), pathfind (the pathfind function returns a target).
		{
			boardNPC[SLVDE.currentPlayer].target = SLVDE.pathToTeam(boardNPC[SLVDE.currentPlayer], boardNPC[SLVDE.currentPlayer].oppTeam);
		}
		else
		{
			//Turn SLVDE.NPC based on simple relativity. Since N and S are more picturesque for TRPG, those are preferred directions.
			if(boardNPC[SLVDE.currentPlayer].target.y > boardNPC[SLVDE.currentPlayer].y)
			{
				boardNPC[SLVDE.currentPlayer].dir = 3;
			}
			else if(boardNPC[SLVDE.currentPlayer].target.y < boardNPC[SLVDE.currentPlayer].y)
			{
				boardNPC[SLVDE.currentPlayer].dir = 1;
			}
			else if(boardNPC[SLVDE.currentPlayer].target.x > boardNPC[SLVDE.currentPlayer].x)
			{
				boardNPC[SLVDE.currentPlayer].dir = 0;
			}
			else if(boardNPC[SLVDE.currentPlayer].target.x < boardNPC[SLVDE.currentPlayer].x)
			{
				boardNPC[SLVDE.currentPlayer].dir = 2;
			}
			//If in range, attack
			if(Math.sqrt(Math.pow(boardNPC[SLVDE.currentPlayer].target.x - boardNPC[SLVDE.currentPlayer].x, 2) + Math.pow(boardNPC[SLVDE.currentPlayer].target.y - boardNPC[SLVDE.currentPlayer].y, 2)) <= 36 && boardNPC[SLVDE.currentPlayer].act != "slash")
			{
				SLVDE.Action.act.slash(boardNPC[SLVDE.currentPlayer]);
/*				boardNPC[SLVDE.currentPlayer].act = "slash";
				boardNPC[SLVDE.currentPlayer].SLVDE.countdown = 16;*/
			}
			else if(boardNPC[SLVDE.currentPlayer].act != "slash") //If not worth slashing or already slashing (end turn gets handled after slash), end turn
			{
				SLVDE.TRPGNextTurn();
			}
		}
	}
};

SLVDE.TRPGPlayerMotion = function() //Function for current SLVDE.player's motion and other key handlings in TRPG mode.
{
	var index;
	if(!SLVDE.player[SLVDE.currentPlayer].squares)
	{
		SLVDE.player[SLVDE.currentPlayer].squares = [];
		SLVDE.PF.getSquares(SLVDE.player[SLVDE.currentPlayer]);
		SLVDE.PF.reformUnitsOnSquareWithout(SLVDE.xPixToTile(SLVDE.player[SLVDE.currentPlayer].x), SLVDE.yPixToTile(SLVDE.player[SLVDE.currentPlayer].y), SLVDE.player, SLVDE.player[SLVDE.currentPlayer]);
	}
	if(SLVDE.player[SLVDE.currentPlayer].path.x.length > 0) //TODO: check JSHint-prompted modification 
	{
		if(SLVDE.counter%4 === 0) { SLVDE.player[SLVDE.currentPlayer].frame = (SLVDE.player[SLVDE.currentPlayer].frame + 1)%4; }
		pathMotion(SLVDE.player[SLVDE.currentPlayer], 8);
	}
	else
	{
		if(SLVDE.PF.onSquare(SLVDE.player[SLVDE.currentPlayer]))
		{
		//alert("on square");
			if(SLVDE.keyFirstDown == "enter" || SLVDE.keyFirstDown == "space") //ENTER and SPACE
			{
/*				alert(SLVDE.NPC[30].x)
				alert(boardNPC[30].x);*/
				for(index = 0; index < boardNPC.length; index++)
				{
					if(Math.abs(SLVDE.player[SLVDE.currentPlayer].x - boardNPC[index].x) < 20 && Math.abs(SLVDE.player[SLVDE.currentPlayer].y - boardNPC[index].y) < 12 && boardNPC[index].program)
					{
						resumeFunc = boardNPC[index].program;
						resumeCue = boardNPC[index].program(0);
					}
				}
			}
			if(SLVDE.keyFirstDown == "k" && !SLVDE.player[SLVDE.currentPlayer].act && !SLVDE.player[SLVDE.currentPlayer].inAir) //K
			{
				//alert("prepare for next turn");
				SLVDE.TRPGNextTurn();
				delete SLVDE.keyFirstDown;
				return;
			}
			if(SLVDE.keyFirstDown == "i") //I
			{
//				SLVDE.player[SLVDE.currentPlayer].iFunction();
				delete SLVDE.keyFirstDown;
			}
			if(SLVDE.keyFirstDown == "j") //J
			{
				SLVDE.Action.act.slash(SLVDE.player[SLVDE.currentPlayer]);
/*				SLVDE.player[SLVDE.currentPlayer].act = "slash";
				SLVDE.player[SLVDE.currentPlayer].SLVDE.countdown = 16;*/
				delete SLVDE.keyFirstDown;
//				SLVDE.TRPGNextTurn();
			}
			if(SLVDE.keyFirstDown == "l") //L
			{
				SLVDE.player[SLVDE.currentPlayer].lFunction();
				delete SLVDE.keyFirstDown;
			}
		}
		var dx = 0;
		var dy = 0;
/*		alert(SLVDE.player[SLVDE.currentPlayer].ix);
		alert(SLVDE.player[SLVDE.currentPlayer].x);
		alert(SLVDE.player[SLVDE.currentPlayer].ix - SLVDE.player[SLVDE.currentPlayer].x);
		alert(SLVDE.player[SLVDE.currentPlayer].iy - SLVDE.player[SLVDE.currentPlayer].y);
		alert(Math.abs(SLVDE.player[SLVDE.currentPlayer].ix - SLVDE.player[SLVDE.currentPlayer].x) + Math.abs(SLVDE.player[SLVDE.currentPlayer].iy - SLVDE.player[SLVDE.currentPlayer].y));*/

		//alert("still in range");
		if(SLVDE.keyDown[37] == 1 || SLVDE.keyDown[65] == 1) //West
		{
			dx = -32;
			SLVDE.player[SLVDE.currentPlayer].dir = 2;
		}
		else if(SLVDE.keyDown[38] == 1 || SLVDE.keyDown[87] == 1) //North
		{
			dy = -32;
			SLVDE.player[SLVDE.currentPlayer].dir = 1;
		}
		else if(SLVDE.keyDown[39] == 1 || SLVDE.keyDown[68] == 1) //East
		{
			dx = 32;
			SLVDE.player[SLVDE.currentPlayer].dir = 0;
		}
		else if(SLVDE.keyDown[40] == 1 || SLVDE.keyDown[83] == 1) //South
		{
			dy = 32;
			SLVDE.player[SLVDE.currentPlayer].dir = 3;
		}
		////If not traveling too far and not traveling out of bounds.
		//If target square is one of predetermined squares
//		if(/*Math.abs(SLVDE.player[SLVDE.currentPlayer].ix - (SLVDE.player[SLVDE.currentPlayer].x + dx)) + Math.abs(SLVDE.player[SLVDE.currentPlayer].iy - (SLVDE.player[SLVDE.currentPlayer].y + dy)) <= 32*SLVDE.player[SLVDE.currentPlayer].spd && SLVDE.player[SLVDE.currentPlayer].x + dx >= 0 && SLVDE.player[SLVDE.currentPlayer].y + dy >= 0 && SLVDE.player[SLVDE.currentPlayer].x + dx < SLVDE.currentLevel.layerImg[SLVDE.player[SLVDE.currentPlayer].layer].width && SLVDE.player[SLVDE.currentPlayer].y + dy < SLVDE.currentLevel.layerImg[SLVDE.player[SLVDE.currentPlayer].layer].height*/)
		if(SLVDE.PF.isSquare(SLVDE.player[SLVDE.currentPlayer].x + dx, SLVDE.player[SLVDE.currentPlayer].y + dy, SLVDE.player[SLVDE.currentPlayer]))
		{
			//alert("ds done");
			if(dx !== 0 || dy !== 0)
			{
				var toIndex = SLVDE.pixCoordToIndex(SLVDE.xPixToTile(SLVDE.player[SLVDE.currentPlayer].x + dx), SLVDE.yPixToTile(SLVDE.player[SLVDE.currentPlayer].y + dy), SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer]);
				var squareType = SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[toIndex];
//				var blocked = 0;
				if(squareType != 255)
				{
/*					for(var second = 0; second < boardNPC.length; second++)
					{
						if(boardNPC[second].x == SLVDE.player[SLVDE.currentPlayer].x + dx && boardNPC[second].y == SLVDE.player[SLVDE.currentPlayer].y + dy)
						{
							blocked = 1;
						}
					}
					if(blocked != 1)
					{*/
						if(SLVDE.player[SLVDE.currentPlayer].frame === 0) { SLVDE.player[SLVDE.currentPlayer].frame = 1; }
						SLVDE.player[SLVDE.currentPlayer].path.x[0] = SLVDE.player[SLVDE.currentPlayer].x + dx;
						SLVDE.player[SLVDE.currentPlayer].path.y[0] = SLVDE.player[SLVDE.currentPlayer].y + dy;
						if(squareType == 100)
						{
							resumeFunc = SLVDE.currentLevel.boardProgram[SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[toIndex + 2]];
							resumeCue = 1;
						}
//					}
				}
			}
			else { SLVDE.player[SLVDE.currentPlayer].frame = 0; }
		}
		//else alert("out of range");
		//Projectile motion
		var dartLayer = SLVDE.player[SLVDE.currentPlayer].dart.layer;
		if(SLVDE.player[SLVDE.currentPlayer].dart.img && dartLayer !== null && dartLayer !== undefined)
		{
			//Move projectile
			var moved = zeldaStep(SLVDE.player[SLVDE.currentPlayer].dart, SLVDE.player[SLVDE.currentPlayer].dart.spd);
			for(index = 0; index < boardNPC.length; index++)
			{
				if((Math.abs(SLVDE.player[SLVDE.currentPlayer].dart.y - (boardNPC[index].y - 24)) < 32) && (Math.abs(SLVDE.player[SLVDE.currentPlayer].dart.x - boardNPC[index].x) < 16))
				{
					SLVDE.damage(SLVDE.player[SLVDE.currentPlayer].dart, boardNPC[index]); //damage hit opponent
					SLVDE.player[SLVDE.currentPlayer].dart.layer = null; //remove SLVDE.image
					SLVDE.player[SLVDE.currentPlayer].dart.frame = 0; //reset frame
					boardNPC[index].status = "hurt"; //"hurt" opponent
					boardNPC[index].SLVDE.countdown = 4; //"hurt" blinks
					index = boardNPC.length; //break out of loop
					SLVDE.TRPGNextTurn();
				}
			}
			//If hit terrain
			dartLayer = SLVDE.player[SLVDE.currentPlayer].dart.layer;
			if(dartLayer !== null && dartLayer !== undefined && moved == -1)
			{
				SLVDE.player[SLVDE.currentPlayer].dart.layer = null;
				SLVDE.player[SLVDE.currentPlayer].dart.frame = 0;
				SLVDE.TRPGNextTurn();

			}
			//Update frame
			if(SLVDE.frameClock == 1)
			{
				SLVDE.player[SLVDE.currentPlayer].dart.frame = (SLVDE.player[SLVDE.currentPlayer].dart.frame + 1)%4;
			}
		}
	}
};
