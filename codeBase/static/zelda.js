SLVDE.zeldaNPCMotion = function() //Function for all non-SLVDE.player SLVDE.boardSprite's movement in Zelda mode.
{
	if(SLVDE.process != "zelda")
	{
		return -1;
	}
	for(var index = 0; index < SLVDE.boardSprite.length; index++)
	{
		//Facilitate death
		while(index < SLVDE.boardSprite.length && SLVDE.boardSprite[index].hp <= 0)
		{
			SLVDE.boardSprite[index].lvl = null;
			//SLVDE.deleteBoardC(SLVDE.boardSprite[index]);
			SLVDE.boardSprite.splice(index, 1);
		}
		//If at invalid index (bc death ran to end of SLVDE.boardSprite array), don't continue
		if(index >= SLVDE.boardSprite.length) return;
		if(SLVDE.boardSprite[index] != SLVDE.player[SLVDE.currentPlayer])
		{
			var cNPC = SLVDE.boardSprite[index];

			if(cNPC.path.length > 0) //Handle path motion
			{
				cNPC.updateFrame();
				cNPC.pathMotion(cNPC.spd);
			}
			else
			{
				//Set stance to default based on direction
				cNPC.defaultStance();

				cNPC.handleStatus();
				cNPC.handleAction();
			}
		}
	}
};

SLVDE.zeldaPlayerMotion = function() //Function for current SLVDE.player's motion and other key handlings in Zelda mode.
{
	var person = SLVDE.player[SLVDE.currentPlayer];
	var i;
	if(SLVDE.keyFirstDown == "enter" || SLVDE.keyFirstDown == "space")
	{
		for(var index = 0; index < SLVDE.boardAgent.length; index++)
		{
			var otherAgent = SLVDE.boardAgent[index];
			if(Math.abs(person.x - otherAgent.x) < 32 && Math.abs(person.y - otherAgent.y) < 32)
			{
				otherAgent.interact();
			}
		}
		delete SLVDE.keyFirstDown;
	}
	if(SLVDE.keyFirstDown == "k" && person.act.length === 0 && !person.inAir)
	{
		var prevPlayer = SLVDE.currentPlayer;
		SLVDE.currentPlayer = (SLVDE.currentPlayer + 1)%SLVDE.player.length;
		//Only switch between players on this map
		while(SLVDE.player[SLVDE.currentPlayer].lvl != SLVDE.player[prevPlayer].lvl)
		{
			SLVDE.currentPlayer = (SLVDE.currentPlayer + 1)%SLVDE.player.length;
		}
		person = SLVDE.player[SLVDE.currentPlayer];
		person.setX(SLVDE.player[prevPlayer].x);
		person.setY(SLVDE.player[prevPlayer].y);
		person.setLayer(SLVDE.player[prevPlayer].layer);
		person.dir = SLVDE.player[prevPlayer].dir;
		SLVDE.deleteBoardC(SLVDE.player[prevPlayer]);
		SLVDE.insertBoardC(person);
		delete SLVDE.keyFirstDown;
	}

	person.defaultStance();
	person.handleStatus();

	if(SLVDE.keyFirstDown && person.keyFunc[SLVDE.keyFirstDown])
	{
		SLVDE.mainPromise = person.keyFunc[SLVDE.keyFirstDown]();

		delete SLVDE.keyFirstDown;
	}

	//Handle persistent actions
	for(i = 0; i < person.act.length; i++)
	{
		var currentAct = person.getAct(i);
		currentAct.update(person);
		if(currentAct.time <= 0)
		{
			person.act.splice(i, 1);
			if(SLVDE.process == "TRPG")
			{
				SLVDE.TRPGNextTurn(); //in TRPG.js
			}
		}
	}

	if(person.hp <= 0)
	{
		resumeFunc = die;
		resumeCue = die(1);
		return;
	}
/*		if(SLVDE.player[SLVDE.currentPlayer].act == "jumping")
		{
			//actionCountdown goes from 32 to -32 before this is not needed
			//First (>0), move north using upper layer collisions to emulate jumping graphic
			//Second (==0), check if able to land on upper SLVDE.level, if so land; otherwise if not able to land on lower SLVDE.level, path back to jumping start place and end jump
			//Third (<0), move south using lower layer
			//Finally, end at ==-32
			if(SLVDE.player[SLVDE.currentPlayer].actCountdown > 0)
			{
				//Move north
				zeldaBump(SLVDE.player[SLVDE.currentPlayer], 8, 1);
				//SLVDE.player[SLVDE.currentPlayer].y--;
			}
			else if(SLVDE.player[SLVDE.currentPlayer].actCountdown == 0)
			{
				if(SLVDE.player[SLVDE.currentPlayer].canBeHere(0))
				{
					delete SLVDE.player[SLVDE.currentPlayer].inAir;
				}
				else
				{
					SLVDE.player[SLVDE.currentPlayer].layer--;
					SLVDE.player[SLVDE.currentPlayer].y += 64;
		//??????????????Compliments of department of redundancy department?
					if(SLVDE.player[SLVDE.currentPlayer].canBeHere(0)) { }
					else
					{
						delete SLVDE.player[SLVDE.currentPlayer].act;
						delete SLVDE.player[SLVDE.currentPlayer].inAir;
						SLVDE.player[SLVDE.currentPlayer].path.x[0] = SLVDE.player[SLVDE.currentPlayer].ix;
						SLVDE.player[SLVDE.currentPlayer].path.y[0] = SLVDE.player[SLVDE.currentPlayer].iy;
					}
					SLVDE.player[SLVDE.currentPlayer].y -= 64;
				}
			}
			else if(SLVDE.player[SLVDE.currentPlayer].actCountdown >= -32)
			{
				SLVDE.player[SLVDE.currentPlayer].y += 2*(SLVDE.player[SLVDE.currentPlayer].actCountdown + 32);
				zeldaBump(SLVDE.player[SLVDE.currentPlayer], 8, 3);
				SLVDE.player[SLVDE.currentPlayer].y -= 2*(SLVDE.player[SLVDE.currentPlayer].actCountdown + 32);
				//SLVDE.player[SLVDE.currentPlayer].y++;
			}
			else
			{
				delete SLVDE.player[SLVDE.currentPlayer].act;
				delete SLVDE.player[SLVDE.currentPlayer].inAir;
			}
			SLVDE.player[SLVDE.currentPlayer].actCountdown -= 4;
		}
		else if(SLVDE.player[SLVDE.currentPlayer].act == "homing")
		{
			var done = 0;
			zeldaLockOnPoint(SLVDE.player[SLVDE.currentPlayer], SLVDE.player[SLVDE.currentPlayer].target.x, SLVDE.player[SLVDE.currentPlayer].target.y); //Lock direction on target
			var dist = Math.sqrt(Math.pow(SLVDE.player[SLVDE.currentPlayer].target.x - SLVDE.player[SLVDE.currentPlayer].x, 2) + Math.pow(SLVDE.player[SLVDE.currentPlayer].target.y - SLVDE.player[SLVDE.currentPlayer].y, 2))
			if(dist <= 32) //If closing in, knock back target
			{
				var tDir = SLVDE.player[SLVDE.currentPlayer].target.dir;
				SLVDE.player[SLVDE.currentPlayer].target.dir = SLVDE.player[SLVDE.currentPlayer].dir;
				zeldaStep(SLVDE.player[SLVDE.currentPlayer].target, 32);
				SLVDE.player[SLVDE.currentPlayer].target.dir = tDir;
				SLVDE.player[SLVDE.currentPlayer].target.status = "stunned"; //stun
				delete SLVDE.player[SLVDE.currentPlayer].target.act; //stop action (e.g. slashing)
				SLVDE.player[SLVDE.currentPlayer].target.statusCountdown = 100;
				done = 1;
			}
			if(zeldaStep(SLVDE.player[SLVDE.currentPlayer], 32) == -1 || done == 1)
			{
				delete SLVDE.player[SLVDE.currentPlayer].target;
				delete SLVDE.player[SLVDE.currentPlayer].inAir;
				delete SLVDE.player[SLVDE.currentPlayer].status;
				delete SLVDE.player[SLVDE.currentPlayer].act;
			}
//			pathMotion(SLVDE.player[SLVDE.currentPlayer], 32);
		}*/
//	}
	if(person.path.length === 0)
	{
		if(SLVDE.figurePlayerDirection()) //If pressing direction(s), step
		{
			person.updateFrame();
//			if(SLVDE.player[SLVDE.currentPlayer].act == "jumping" && SLVDE.player[SLVDE.currentPlayer].inAir == 1 && SLVDE.player[SLVDE.currentPlayer].actCountdown < 0) SLVDE.player[SLVDE.currentPlayer].y += 2*(SLVDE.player[SLVDE.currentPlayer].actCountdown + 32);
			if(person.zeldaStep(person.spd) < 0) {}//console.log("stopped");
//			if(SLVDE.player[SLVDE.currentPlayer].act == "jumping" && SLVDE.player[SLVDE.currentPlayer].inAir == 1 && SLVDE.player[SLVDE.currentPlayer].actCountdown < 0) SLVDE.player[SLVDE.currentPlayer].y -= 2*(SLVDE.player[SLVDE.currentPlayer].actCountdown + 32);
		}
		else
		{
			person.frame = 0;
		}
		var limit = person.baseLength/2;
		for(var ind = -limit; ind < limit; ind++)
		{
			for(var sec = -limit; sec < limit; sec++)
			{
				i = SLVDE.pixCoordToIndex(SLVDE.player[SLVDE.currentPlayer].x + sec, SLVDE.player[SLVDE.currentPlayer].y + ind, SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer]);
				if(SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[i] == 100)
				{
					SLVDE.player[SLVDE.currentPlayer].onPrg = SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[i + 2];
					resumeFunc = SLVDE.currentLevel.boardProgram[SLVDE.player[SLVDE.currentPlayer].onPrg];
					if(SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[i + 1] == 1)
					{
						if(SLVDE.player[SLVDE.currentPlayer].wasOnPrg != SLVDE.player[SLVDE.currentPlayer].onPrg) //ensure program is not run twice
						{
							resumeCue = SLVDE.currentLevel.boardProgram[SLVDE.player[SLVDE.currentPlayer].onPrg](0);
						}
						//alert("program");
					}
					else if(SLVDE.currentLevel.layerFuncData[SLVDE.player[SLVDE.currentPlayer].layer].data[i + 1] == 2)
					{
						if(SLVDE.keyFirstDown == "enter" || SLVDE.keyFirstDown == "space") //require ENTER or SPACE to run program
						{
							delete SLVDE.keyFirstDown;
							resumeCue = SLVDE.currentLevel.boardProgram[SLVDE.player[SLVDE.currentPlayer].onPrg](0);
						}
					}
					else //Just run program if on
					{
						resumeCue = SLVDE.currentLevel.boardProgram[SLVDE.player[SLVDE.currentPlayer].onPrg](0);
					}
					ind = 9;
					sec = 17;
				}
			}
		}
		SLVDE.player[SLVDE.currentPlayer].wasOnPrg = SLVDE.player[SLVDE.currentPlayer].onPrg;
		SLVDE.player[SLVDE.currentPlayer].onPrg = -1;
	}
	else
	{
		person.updateFrame();
		person.pathMotion(person.spd);
	}

	//Pet motion
/*	if(SLVDE.player[SLVDE.currentPlayer].pet != null) //If pet is in use
	{
		if(SLVDE.player[SLVDE.currentPlayer].pet.status == "active") //If pet is in active state
		{
			delete SLVDE.player[SLVDE.currentPlayer].pet.target; //reset target
			var tDist = 97; //initialize currently closest distance
			for(var index = 0; index < boardNPC.length; index++) //Cycle through boardNPC to determine closest one to SLVDE.player within 64 pixels
			{
				var dist = Math.sqrt(Math.pow(boardNPC[index].x - SLVDE.player[SLVDE.currentPlayer].x, 2) + Math.pow(boardNPC[index].y - SLVDE.player[SLVDE.currentPlayer].y, 2));
				if(dist <= 96 && SLVDE.player[SLVDE.currentPlayer].layer == boardNPC[index].layer)
				{
					if(SLVDE.player[SLVDE.currentPlayer].pet.target == null || dist < tDist)
					{
						SLVDE.player[SLVDE.currentPlayer].pet.target = boardNPC[index];
						tDist = dist;
					}
				}
			}
			if(SLVDE.player[SLVDE.currentPlayer].pet.target != null) //If target was found
			{
				zeldaLockOnPoint(SLVDE.player[SLVDE.currentPlayer].pet, SLVDE.player[SLVDE.currentPlayer].pet.target.x, SLVDE.player[SLVDE.currentPlayer].pet.target.y); //Orient pet toward target
				zeldaStep(SLVDE.player[SLVDE.currentPlayer].pet, SLVDE.player[SLVDE.currentPlayer].spd + 2); //Step toward target
				//Start slashing as fast as possible
				if(SLVDE.player[SLVDE.currentPlayer].pet.rcvr == 0 && SLVDE.player[SLVDE.currentPlayer].pet.act != "slash")
				{
					SLVDE.player[SLVDE.currentPlayer].pet.act = "slash";
					SLVDE.player[SLVDE.currentPlayer].pet.actCountdown = 4;
				}
				else if(SLVDE.player[SLVDE.currentPlayer].pet.rcvr != 0)
				{
					SLVDE.player[SLVDE.currentPlayer].pet.rcvr--;
					if(SLVDE.player[SLVDE.currentPlayer].pet.rcvr < 0)
					{
						SLVDE.player[SLVDE.currentPlayer].pet.rcvr = 0;
					}
				}
			}
			else if(SLVDE.keyDown[73]) //Move toward SLVDE.player if not attacking and I is pressed
			{
				zeldaLockOnPoint(SLVDE.player[SLVDE.currentPlayer].pet, SLVDE.player[SLVDE.currentPlayer].x, SLVDE.player[SLVDE.currentPlayer].y);
				zeldaStep(SLVDE.player[SLVDE.currentPlayer].pet, SLVDE.player[SLVDE.currentPlayer].spd - 2);
			}
			else
			{
				if(SLVD.randomInt(50) == 1)
				{
					SLVDE.player[SLVDE.currentPlayer].pet.dir = SLVD.randomInt(4) - 1;
					zeldaStep(SLVDE.player[SLVDE.currentPlayer].pet, 1);
				}
			}
			//Update frame
			if(SLVDE.frameClock == 1) SLVDE.player[SLVDE.currentPlayer].pet.frame = (SLVDE.player[SLVDE.currentPlayer].pet.frame + 1)%4;
			//Trend toward inactivity
			SLVDE.player[SLVDE.currentPlayer].pet.statusCountdown--;
			if(SLVDE.player[SLVDE.currentPlayer].pet.statusCountdown <= 0)
			{
				SLVDE.player[SLVDE.currentPlayer].pet.status = "inactive";
				SLVDE.player[SLVDE.currentPlayer].pet.statusCountdown = 50;
			}
		}
		else
		{
			SLVDE.player[SLVDE.currentPlayer].pet.statusCountdown--;
			if(SLVDE.player[SLVDE.currentPlayer].pet.statusCountdown <= 0)
			{
				SLVDE.deleteBoardC(SLVDE.player[SLVDE.currentPlayer].pet);
				delete SLVDE.player[SLVDE.currentPlayer].pet;
			}
		}
	}*/

	//Projectile motion
/*	if(SLVDE.player[SLVDE.currentPlayer].dart.img != null && SLVDE.player[SLVDE.currentPlayer].dart.layer != null)
	{
		//Move projectile
		var moved = zeldaStep(SLVDE.player[SLVDE.currentPlayer].dart, SLVDE.player[SLVDE.currentPlayer].dart.spd);
		for(var index = 0; index < boardNPC.length; index++)
		{
			if((Math.abs(SLVDE.player[SLVDE.currentPlayer].dart.y - (boardNPC[index].y - 24)) < 32) && (Math.abs(SLVDE.player[SLVDE.currentPlayer].dart.x - boardNPC[index].x) < 16))
			{
				SLVDE.damage(SLVDE.player[SLVDE.currentPlayer].dart, boardNPC[index]); //damage hit opponent
				SLVDE.player[SLVDE.currentPlayer].dart.setLayer(null); //remove SLVDE.image
				SLVDE.player[SLVDE.currentPlayer].dart.frame = 0; //reset frame
				SLVDE.deleteBoardC(SLVDE.player[SLVDE.currentPlayer].dart);
				boardNPC[index].status = "hurt"; //"hurt" opponent
				boardNPC[index].statusCountdown = 4; //"hurt" blinks
				index = boardNPC.length; //break out of loop
			}
		}
		//If hit terrain
		if(moved == -1)
		{
			SLVDE.player[SLVDE.currentPlayer].dart.setLayer(null);
			SLVDE.player[SLVDE.currentPlayer].dart.frame = 0;
			SLVDE.deleteBoardC(SLVDE.player[SLVDE.currentPlayer].dart);
		}
		//Update frame
		if(SLVDE.frameClock == 1)
		{
			SLVDE.player[SLVDE.currentPlayer].dart.frame = (SLVDE.player[SLVDE.currentPlayer].dart.frame + 1)%4;
		}
	}*/
};
