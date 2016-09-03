			/*SplitTime.orientScreen();
			for(var index = 0; index < SplitTime.currentLevel.layerImg.length; index++)
			{
				//Draw layer
				SplitTime.see.drawImage(SplitTime.currentLevel.layerImg[index], SplitTime.wX, SplitTime.wY, SplitTime.SCREENX, SplitTime.SCREENY, 0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
				//Draw blue range squares
				if(index == SplitTime.cTeam[SplitTime.currentPlayer].layer && SplitTime.cTeam[SplitTime.currentPlayer].squares != null)
				{
					for(var second = 0; second < SplitTime.cTeam[SplitTime.currentPlayer].squares.length; second++)
					{
						SplitTime.see.drawImage(SplitTime.image["blueSquare.png"], 0, 0, 32, 32, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
					}
				}
				for(var second = 0; second < SplitTime.boardBody.length; second++)
				{
					if(SplitTime.boardBody[second].act == "slash")
					{
						//If done slashing, move on.
						if(SplitTime.boardBody[second].SplitTime.countdown <= 0)
						{
							SplitTime.boardBody[second].act = null;
							SplitTime.TRPGNextTurn();
						}
						else
						{
							//Cycle through opponents
							for(var third = 0; third < SplitTime.boardBody[second].oppTeam.length; third++)
							{
								//If distance < 40
								//if(Math.sqrt(Math.pow(SplitTime.boardBody[second].oppTeam[third].x - SplitTime.boardBody[second].x, 2) + Math.pow(SplitTime.boardBody[second].oppTeam[third].y - SplitTime.boardBody[second].y, 2)) <= 36)
								//If one tile away
								if(Math.pow(SplitTime.xPixToTile(SplitTime.boardBody[second].oppTeam[third].x) - SplitTime.xPixToTile(SplitTime.boardBody[second].x), 2) + Math.pow(SplitTime.yPixToTile(SplitTime.boardBody[second].oppTeam[third].y) - SplitTime.yPixToTile(SplitTime.boardBody[second].y), 2) == 1)
								{
									//Determine angle between slasher and opponent (in terms of PI/2)
									var angle = Math.atan(-(SplitTime.boardBody[second].oppTeam[third].y - SplitTime.boardBody[second].y)/(SplitTime.boardBody[second].oppTeam[third].x - SplitTime.boardBody[second].x))/(Math.PI/2);

									if(SplitTime.boardBody[second].oppTeam[third].x > SplitTime.boardBody[second].x && SplitTime.boardBody[second].oppTeam[third].y > SplitTime.boardBody[second].y)
									{
										angle += 4;
									}
									else if(SplitTime.boardBody[second].oppTeam[third].x < SplitTime.boardBody[second].x)
									{
										angle += 2;
									}
									//Compare angle to direction of slasher. If in range of PI...
									if((Math.abs(angle - SplitTime.boardBody[second].dir) <= .5 || Math.abs(angle - SplitTime.boardBody[second].dir) >= 3.5) && SplitTime.boardBody[second].oppTeam[third].status != "hurt")
									{
										SplitTime.damage(SplitTime.boardBody[second], SplitTime.boardBody[second].oppTeam[third]);
										SplitTime.boardBody[second].oppTeam[third].status = "hurt";
										SplitTime.boardBody[second].oppTeam[third].SplitTime.countdown = 4;
									}
								}
							}
							SplitTime.see.lineWidth = 8;
							SplitTime.see.beginPath();
							SplitTime.see.arc((SplitTime.boardBody[second].x - ((SplitTime.boardBody[second].xres)/2)) - SplitTime.wX + 24, (SplitTime.boardBody[second].y - (SplitTime.boardBody[second].yres)) - SplitTime.wY + 56, 32, .5*((3 - SplitTime.boardBody[second].dir) - .5 + (SplitTime.boardBody[second].SplitTime.countdown/8))*Math.PI, .5*((3 - SplitTime.boardBody[second].dir) + .5 + (SplitTime.boardBody[second].SplitTime.countdown/8))*Math.PI);
							SplitTime.see.strokeStyle = "white";
							SplitTime.see.stroke();
							SplitTime.boardBody[second].SplitTime.countdown--;
							if(SplitTime.boardBody[second].SplitTime.countdown < 0)
							{
								SplitTime.boardBody[second].SplitTime.countdown = 0;
							}
						}
					}
					if(SplitTime.boardBody[second].layer == index)
					{
						if((SplitTime.boardBody[second].status == "hurt" && SplitTime.frameClock != 1) || SplitTime.boardBody[second].status != "hurt")
						{
							var col = SplitTime.determineColumn(SplitTime.boardBody[second].dir);
							SplitTime.see.drawImage(SplitTime.boardBody[second].img, 32*col, 64*SplitTime.boardBody[second].frame, SplitTime.boardBody[second].xres, SplitTime.boardBody[second].yres, (SplitTime.boardBody[second].x - (((SplitTime.boardBody[second].xres)/2) - 8)) - SplitTime.wX, (SplitTime.boardBody[second].y - (SplitTime.boardBody[second].yres - 8)) - SplitTime.wY, SplitTime.boardBody[second].xres, SplitTime.boardBody[second].yres);
							if(SplitTime.boardBody[second].holding != null && Math.round(SplitTime.boardBody[second].dir) != 1)
							{
								SplitTime.see.drawImage(SplitTime.boardBody[second].holding, (SplitTime.boardBody[second].holding.width/4)*col, 0, (SplitTime.boardBody[second].holding.width/4), 32, (SplitTime.boardBody[second].x - (((SplitTime.boardBody[second].xres)/2) - 8)) - SplitTime.wX + 16*Math.round(Math.cos(SplitTime.boardBody[second].dir*Math.PI/2)), (SplitTime.boardBody[second].y - (SplitTime.boardBody[second].yres - 18)) - SplitTime.wY - 5*Math.round(Math.sin(SplitTime.boardBody[second].dir*Math.PI/2)), 32, 32);
							}
						}
						if(SplitTime.boardBody[second].status == "hurt" && SplitTime.frameClock == 1)
						{
								SplitTime.boardBody[second].SplitTime.countdown--;
								if(SplitTime.boardBody[second].SplitTime.countdown <= 0)
								{
									SplitTime.boardBody[second].status = null;
								}
						}
					}
					if(SplitTime.boardBody[second].dart.layer == index)
					{
						var col = SplitTime.determineColumn(SplitTime.boardBody[second].dart.dir);
						SplitTime.see.drawImage(SplitTime.boardBody[second].dart.img, SplitTime.boardBody[second].dart.xres*col, SplitTime.boardBody[second].dart.yres*SplitTime.boardBody[second].dart.frame, SplitTime.boardBody[second].dart.xres, SplitTime.boardBody[second].dart.yres, SplitTime.boardBody[second].dart.x - SplitTime.wX, SplitTime.boardBody[second].dart.y - SplitTime.wY, SplitTime.boardBody[second].dart.xres, SplitTime.boardBody[second].dart.yres);
					}
				}
			}
			//Weather
			SplitTime.see.fillStyle = "rgba(0, 0, 0, " + shade + ")";
			SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
			if(rainy)
			{
				SplitTime.see.drawImage(SplitTime.image["rain.png"], -((SplitTime.counter%100)/100)*SplitTime.SCREENX, ((SplitTime.counter%25)/25)*SplitTime.SCREENY - SplitTime.SCREENY);
				if(SplitTime.counter%8 == SLVD.randomInt(12))
				{
					for(var index = 0; index < SLVD.randomInt(3); index++)
					{
						SplitTime.see.drawImage(SplitTime.image["lightning.png"], 0, 0);
					}
				}
			}
			if(cloudy) SplitTime.see.drawImage(SplitTime.image["stormClouds.png"], SplitTime.counter%1280 - 1280, 0);
			//document.getElementById("info").innerHTML = SplitTime.player[0].dir + ", " + SplitTime.player[0].x + ", " + SplitTime.player[0].y + ", " + dKeys
			SplitTime.see.fillStyle="#FFFFFF";
			SplitTime.see.font="12px Verdana";
			SplitTime.see.fillText(SplitTime.cTeam[SplitTime.currentPlayer].name + ": " + SplitTime.cTeam[SplitTime.currentPlayer].hp + " HP | " + SplitTime.cTeam[SplitTime.currentPlayer].strg + " Strength | " + SplitTime.cTeam[SplitTime.currentPlayer].spd + " Speed", 10, 20);
			*/

SplitTime.TRPGNextTurn = function() //Function run at the end of a character's turn in TRPG mode. Most notably sets SplitTime.cTeam and SplitTime.currentPlayer.
{
	if(SplitTime.currentPlayer >= 0)
	{
		SplitTime.cTeam[SplitTime.currentPlayer].dir = 3;
		SplitTime.PF.reformUnitsOnSquareWithout(SplitTime.xPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].x), SplitTime.yPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].y), SplitTime.cTeam, 0);
	}
	if(SplitTime.cTeam[SplitTime.currentPlayer])
	{
		delete SplitTime.cTeam[SplitTime.currentPlayer].squares;
		delete SplitTime.cTeam[SplitTime.currentPlayer].target;
	}
	if(SplitTime.currentPlayer < SplitTime.cTeam.length - 1)
	{
		SplitTime.currentPlayer++;
	}
	else if(SplitTime.cTeam[SplitTime.currentPlayer].oppTeam.length !== 0)
	{
		SplitTime.cTeam = SplitTime.cTeam[SplitTime.currentPlayer].oppTeam;
		SplitTime.currentPlayer = 0;

		if(SplitTime.cTeam == SplitTime.player)
		{
			SplitTime.Time.advance(12*60*60); //in time.js
		}
	}
	else
	{
		resumeFunc = die;
		resumeCue = resumeFunc(2);
		SplitTime.currentPlayer = 0;
	}
	//alert(SplitTime.cTeam[SplitTime.currentPlayer].name + SplitTime.currentPlayer);
	SplitTime.cTeam[SplitTime.currentPlayer].ix = SplitTime.cTeam[SplitTime.currentPlayer].x;
	SplitTime.cTeam[SplitTime.currentPlayer].iy = SplitTime.cTeam[SplitTime.currentPlayer].y;

	SplitTime.PF.reformUnitsOnSquareWithout(SplitTime.xPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].x), SplitTime.yPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].y), SplitTime.cTeam, SplitTime.cTeam[SplitTime.currentPlayer]);
	SplitTime.cTeam[SplitTime.currentPlayer].x = SplitTime.xTileToPix(SplitTime.xPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].x));
	SplitTime.cTeam[SplitTime.currentPlayer].y = SplitTime.yTileToPix(SplitTime.yPixToTile(SplitTime.cTeam[SplitTime.currentPlayer].y));
/*	SplitTime.process = "wait";
	SplitTime.countdown = 8;*/
};

SplitTime.TRPGNPCMotion = function() //Function for a single SplitTime.NPC whose turn it is in TRPG mode.
{
	if(boardNPC[SplitTime.currentPlayer].dmnr != 2) //If SplitTime.NPC is non-aggressive (such as one for talking to), just move on to next SplitTime.NPC without moving.
	{
		SplitTime.TRPGNextTurn();
	}
	else
	{
		if(boardNPC[SplitTime.currentPlayer].target == -1) //If no path could be found to a target, end turn.
		{
			SplitTime.TRPGNextTurn();
		}
		else if(boardNPC[SplitTime.currentPlayer].path.x.length > 0) //If path is set up, follow path. TODO: check modification of this if for JSHint
		{
			if(SplitTime.counter%4 === 0) { boardNPC[SplitTime.currentPlayer].frame = (boardNPC[SplitTime.currentPlayer].frame + 1)%4; }
			pathMotion(boardNPC[SplitTime.currentPlayer], 8);
		}
		else if(!boardNPC[SplitTime.currentPlayer].target) //If no target (or -1 as "target"), pathfind (the pathfind function returns a target).
		{
			boardNPC[SplitTime.currentPlayer].target = SplitTime.pathToTeam(boardNPC[SplitTime.currentPlayer], boardNPC[SplitTime.currentPlayer].oppTeam);
		}
		else
		{
			//Turn SplitTime.NPC based on simple relativity. Since N and S are more picturesque for TRPG, those are preferred directions.
			if(boardNPC[SplitTime.currentPlayer].target.y > boardNPC[SplitTime.currentPlayer].y)
			{
				boardNPC[SplitTime.currentPlayer].dir = 3;
			}
			else if(boardNPC[SplitTime.currentPlayer].target.y < boardNPC[SplitTime.currentPlayer].y)
			{
				boardNPC[SplitTime.currentPlayer].dir = 1;
			}
			else if(boardNPC[SplitTime.currentPlayer].target.x > boardNPC[SplitTime.currentPlayer].x)
			{
				boardNPC[SplitTime.currentPlayer].dir = 0;
			}
			else if(boardNPC[SplitTime.currentPlayer].target.x < boardNPC[SplitTime.currentPlayer].x)
			{
				boardNPC[SplitTime.currentPlayer].dir = 2;
			}
			//If in range, attack
			if(Math.sqrt(Math.pow(boardNPC[SplitTime.currentPlayer].target.x - boardNPC[SplitTime.currentPlayer].x, 2) + Math.pow(boardNPC[SplitTime.currentPlayer].target.y - boardNPC[SplitTime.currentPlayer].y, 2)) <= 36 && boardNPC[SplitTime.currentPlayer].act != "slash")
			{
				SplitTime.Action.act.slash(boardNPC[SplitTime.currentPlayer]);
/*				boardNPC[SplitTime.currentPlayer].act = "slash";
				boardNPC[SplitTime.currentPlayer].SplitTime.countdown = 16;*/
			}
			else if(boardNPC[SplitTime.currentPlayer].act != "slash") //If not worth slashing or already slashing (end turn gets handled after slash), end turn
			{
				SplitTime.TRPGNextTurn();
			}
		}
	}
};

SplitTime.TRPGPlayerMotion = function() //Function for current SplitTime.player's motion and other key handlings in TRPG mode.
{
	var index;
	if(!SplitTime.player[SplitTime.currentPlayer].squares)
	{
		SplitTime.player[SplitTime.currentPlayer].squares = [];
		SplitTime.PF.getSquares(SplitTime.player[SplitTime.currentPlayer]);
		SplitTime.PF.reformUnitsOnSquareWithout(SplitTime.xPixToTile(SplitTime.player[SplitTime.currentPlayer].x), SplitTime.yPixToTile(SplitTime.player[SplitTime.currentPlayer].y), SplitTime.player, SplitTime.player[SplitTime.currentPlayer]);
	}
	if(SplitTime.player[SplitTime.currentPlayer].path.x.length > 0) //TODO: check JSHint-prompted modification 
	{
		if(SplitTime.counter%4 === 0) { SplitTime.player[SplitTime.currentPlayer].frame = (SplitTime.player[SplitTime.currentPlayer].frame + 1)%4; }
		pathMotion(SplitTime.player[SplitTime.currentPlayer], 8);
	}
	else
	{
		if(SplitTime.PF.onSquare(SplitTime.player[SplitTime.currentPlayer]))
		{
		//alert("on square");
			if(SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space") //ENTER and SPACE
			{
/*				alert(SplitTime.NPC[30].x)
				alert(boardNPC[30].x);*/
				for(index = 0; index < boardNPC.length; index++)
				{
					if(Math.abs(SplitTime.player[SplitTime.currentPlayer].x - boardNPC[index].x) < 20 && Math.abs(SplitTime.player[SplitTime.currentPlayer].y - boardNPC[index].y) < 12 && boardNPC[index].program)
					{
						resumeFunc = boardNPC[index].program;
						resumeCue = boardNPC[index].program(0);
					}
				}
			}
			if(SplitTime.keyFirstDown == "k" && !SplitTime.player[SplitTime.currentPlayer].act && !SplitTime.player[SplitTime.currentPlayer].inAir) //K
			{
				//alert("prepare for next turn");
				SplitTime.TRPGNextTurn();
				delete SplitTime.keyFirstDown;
				return;
			}
			if(SplitTime.keyFirstDown == "i") //I
			{
//				SplitTime.player[SplitTime.currentPlayer].iFunction();
				delete SplitTime.keyFirstDown;
			}
			if(SplitTime.keyFirstDown == "j") //J
			{
				SplitTime.Action.act.slash(SplitTime.player[SplitTime.currentPlayer]);
/*				SplitTime.player[SplitTime.currentPlayer].act = "slash";
				SplitTime.player[SplitTime.currentPlayer].SplitTime.countdown = 16;*/
				delete SplitTime.keyFirstDown;
//				SplitTime.TRPGNextTurn();
			}
			if(SplitTime.keyFirstDown == "l") //L
			{
				SplitTime.player[SplitTime.currentPlayer].lFunction();
				delete SplitTime.keyFirstDown;
			}
		}
		var dx = 0;
		var dy = 0;
/*		alert(SplitTime.player[SplitTime.currentPlayer].ix);
		alert(SplitTime.player[SplitTime.currentPlayer].x);
		alert(SplitTime.player[SplitTime.currentPlayer].ix - SplitTime.player[SplitTime.currentPlayer].x);
		alert(SplitTime.player[SplitTime.currentPlayer].iy - SplitTime.player[SplitTime.currentPlayer].y);
		alert(Math.abs(SplitTime.player[SplitTime.currentPlayer].ix - SplitTime.player[SplitTime.currentPlayer].x) + Math.abs(SplitTime.player[SplitTime.currentPlayer].iy - SplitTime.player[SplitTime.currentPlayer].y));*/

		//alert("still in range");
		if(SplitTime.keyDown[37] == 1 || SplitTime.keyDown[65] == 1) //West
		{
			dx = -32;
			SplitTime.player[SplitTime.currentPlayer].dir = 2;
		}
		else if(SplitTime.keyDown[38] == 1 || SplitTime.keyDown[87] == 1) //North
		{
			dy = -32;
			SplitTime.player[SplitTime.currentPlayer].dir = 1;
		}
		else if(SplitTime.keyDown[39] == 1 || SplitTime.keyDown[68] == 1) //East
		{
			dx = 32;
			SplitTime.player[SplitTime.currentPlayer].dir = 0;
		}
		else if(SplitTime.keyDown[40] == 1 || SplitTime.keyDown[83] == 1) //South
		{
			dy = 32;
			SplitTime.player[SplitTime.currentPlayer].dir = 3;
		}
		////If not traveling too far and not traveling out of bounds.
		//If target square is one of predetermined squares
//		if(/*Math.abs(SplitTime.player[SplitTime.currentPlayer].ix - (SplitTime.player[SplitTime.currentPlayer].x + dx)) + Math.abs(SplitTime.player[SplitTime.currentPlayer].iy - (SplitTime.player[SplitTime.currentPlayer].y + dy)) <= 32*SplitTime.player[SplitTime.currentPlayer].spd && SplitTime.player[SplitTime.currentPlayer].x + dx >= 0 && SplitTime.player[SplitTime.currentPlayer].y + dy >= 0 && SplitTime.player[SplitTime.currentPlayer].x + dx < SplitTime.currentLevel.layerImg[SplitTime.player[SplitTime.currentPlayer].layer].width && SplitTime.player[SplitTime.currentPlayer].y + dy < SplitTime.currentLevel.layerImg[SplitTime.player[SplitTime.currentPlayer].layer].height*/)
		if(SplitTime.PF.isSquare(SplitTime.player[SplitTime.currentPlayer].x + dx, SplitTime.player[SplitTime.currentPlayer].y + dy, SplitTime.player[SplitTime.currentPlayer]))
		{
			//alert("ds done");
			if(dx !== 0 || dy !== 0)
			{
				var toIndex = SplitTime.pixCoordToIndex(SplitTime.xPixToTile(SplitTime.player[SplitTime.currentPlayer].x + dx), SplitTime.yPixToTile(SplitTime.player[SplitTime.currentPlayer].y + dy), SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer]);
				var squareType = SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[toIndex];
//				var blocked = 0;
				if(squareType != 255)
				{
/*					for(var second = 0; second < boardNPC.length; second++)
					{
						if(boardNPC[second].x == SplitTime.player[SplitTime.currentPlayer].x + dx && boardNPC[second].y == SplitTime.player[SplitTime.currentPlayer].y + dy)
						{
							blocked = 1;
						}
					}
					if(blocked != 1)
					{*/
						if(SplitTime.player[SplitTime.currentPlayer].frame === 0) { SplitTime.player[SplitTime.currentPlayer].frame = 1; }
						SplitTime.player[SplitTime.currentPlayer].path.x[0] = SplitTime.player[SplitTime.currentPlayer].x + dx;
						SplitTime.player[SplitTime.currentPlayer].path.y[0] = SplitTime.player[SplitTime.currentPlayer].y + dy;
						if(squareType == 100)
						{
							resumeFunc = SplitTime.currentLevel.boardProgram[SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[toIndex + 2]];
							resumeCue = 1;
						}
//					}
				}
			}
			else { SplitTime.player[SplitTime.currentPlayer].frame = 0; }
		}
		//else alert("out of range");
		//Projectile motion
		var dartLayer = SplitTime.player[SplitTime.currentPlayer].dart.layer;
		if(SplitTime.player[SplitTime.currentPlayer].dart.img && dartLayer !== null && dartLayer !== undefined)
		{
			//Move projectile
			var moved = zeldaStep(SplitTime.player[SplitTime.currentPlayer].dart, SplitTime.player[SplitTime.currentPlayer].dart.spd);
			for(index = 0; index < boardNPC.length; index++)
			{
				if((Math.abs(SplitTime.player[SplitTime.currentPlayer].dart.y - (boardNPC[index].y - 24)) < 32) && (Math.abs(SplitTime.player[SplitTime.currentPlayer].dart.x - boardNPC[index].x) < 16))
				{
					SplitTime.damage(SplitTime.player[SplitTime.currentPlayer].dart, boardNPC[index]); //damage hit opponent
					SplitTime.player[SplitTime.currentPlayer].dart.layer = null; //remove SplitTime.image
					SplitTime.player[SplitTime.currentPlayer].dart.frame = 0; //reset frame
					boardNPC[index].status = "hurt"; //"hurt" opponent
					boardNPC[index].SplitTime.countdown = 4; //"hurt" blinks
					index = boardNPC.length; //break out of loop
					SplitTime.TRPGNextTurn();
				}
			}
			//If hit terrain
			dartLayer = SplitTime.player[SplitTime.currentPlayer].dart.layer;
			if(dartLayer !== null && dartLayer !== undefined && moved == -1)
			{
				SplitTime.player[SplitTime.currentPlayer].dart.layer = null;
				SplitTime.player[SplitTime.currentPlayer].dart.frame = 0;
				SplitTime.TRPGNextTurn();

			}
			//Update frame
			if(SplitTime.frameClock == 1)
			{
				SplitTime.player[SplitTime.currentPlayer].dart.frame = (SplitTime.player[SplitTime.currentPlayer].dart.frame + 1)%4;
			}
		}
	}
};
