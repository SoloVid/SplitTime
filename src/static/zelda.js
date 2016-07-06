SplitTime.zeldaNPCMotion = function() //Function for all non-SplitTime.player SplitTime.boardBody's movement in Zelda mode.
{
	if(SplitTime.process != "zelda")
	{
		return -1;
	}
	for(var index = 0; index < SplitTime.boardBody.length; index++)
	{
		//Facilitate death
		while(index < SplitTime.boardBody.length && SplitTime.boardBody[index].hp <= 0)
		{
			SplitTime.boardBody[index].lvl = null;
			//SplitTime.deleteBoardC(SplitTime.boardBody[index]);
			SplitTime.boardBody.splice(index, 1);
		}
		//If at invalid index (bc death ran to end of SplitTime.boardBody array), don't continue
		if(index >= SplitTime.boardBody.length) return;
		if(SplitTime.boardBody[index] != SplitTime.player[SplitTime.currentPlayer])
		{
			var cNPC = SplitTime.boardBody[index];

			if(cNPC.path.length > 0) //Handle path motion
			{
				cNPC.requestStance("walk");

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

SplitTime.zeldaPlayerMotion = function() //Function for current SplitTime.player's motion and other key handlings in Zelda mode.
{
	var person = SplitTime.player[SplitTime.currentPlayer];
	var i;
	if(SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space")
	{
		for(var index = 0; index < SplitTime.boardAgent.length; index++)
		{
			var otherAgent = SplitTime.boardAgent[index];
			if(Math.abs(person.x - otherAgent.x) < 32 && Math.abs(person.y - otherAgent.y) < 32)
			{
				otherAgent.interact();
			}
		}
		delete SplitTime.keyFirstDown;
	}
	if(SplitTime.keyFirstDown == "k" && person.act.length === 0 && !person.inAir)
	{
		var prevPlayer = SplitTime.currentPlayer;
		SplitTime.currentPlayer = (SplitTime.currentPlayer + 1)%SplitTime.player.length;
		//Only switch between players on this map
		while(SplitTime.player[SplitTime.currentPlayer].lvl != SplitTime.player[prevPlayer].lvl)
		{
			SplitTime.currentPlayer = (SplitTime.currentPlayer + 1)%SplitTime.player.length;
		}
		person = SplitTime.player[SplitTime.currentPlayer];
		person.setX(SplitTime.player[prevPlayer].x);
		person.setY(SplitTime.player[prevPlayer].y);
		person.setLayer(SplitTime.player[prevPlayer].layer);
		person.dir = SplitTime.player[prevPlayer].dir;
		SplitTime.deleteBoardC(SplitTime.player[prevPlayer]);
		SplitTime.insertBoardC(person);
		delete SplitTime.keyFirstDown;
	}

	person.defaultStance();
	person.handleStatus();

	if(SplitTime.keyFirstDown && person.keyFunc[SplitTime.keyFirstDown])
	{
		SplitTime.mainPromise = person.keyFunc[SplitTime.keyFirstDown]();

		delete SplitTime.keyFirstDown;
	}

	//Handle persistent actions
	for(i = 0; i < person.act.length; i++)
	{
		var currentAct = person.getAct(i);
		currentAct.update(person);
		if(currentAct.time <= 0)
		{
			person.act.splice(i, 1);
			if(SplitTime.process == "TRPG")
			{
				SplitTime.TRPGNextTurn(); //in TRPG.js
			}
		}
	}

	if(person.hp <= 0)
	{
		resumeFunc = die;
		resumeCue = die(1);
		return;
	}
		// if(SplitTime.player[SplitTime.currentPlayer].act == "jumping")
		// {
		// 	//actionCountdown goes from 32 to -32 before this is not needed
		// 	//First (>0), move north using upper layer collisions to emulate jumping graphic
		// 	//Second (==0), check if able to land on upper SplitTime.level, if so land; otherwise if not able to land on lower SplitTime.level, path back to jumping start place and end jump
		// 	//Third (<0), move south using lower layer
		// 	//Finally, end at ==-32
		// 	if(SplitTime.player[SplitTime.currentPlayer].actCountdown > 0)
		// 	{
		// 		//Move north
		// 		zeldaBump(SplitTime.player[SplitTime.currentPlayer], 8, 1);
		// 		//SplitTime.player[SplitTime.currentPlayer].y--;
		// 	}
		// 	else if(SplitTime.player[SplitTime.currentPlayer].actCountdown == 0)
		// 	{
		// 		if(SplitTime.player[SplitTime.currentPlayer].canBeHere(0))
		// 		{
		// 			delete SplitTime.player[SplitTime.currentPlayer].inAir;
		// 		}
		// 		else
		// 		{
		// 			SplitTime.player[SplitTime.currentPlayer].layer--;
		// 			SplitTime.player[SplitTime.currentPlayer].y += 64;
		// //??????????????Compliments of department of redundancy department?
		// 			if(SplitTime.player[SplitTime.currentPlayer].canBeHere(0)) { }
		// 			else
		// 			{
		// 				delete SplitTime.player[SplitTime.currentPlayer].act;
		// 				delete SplitTime.player[SplitTime.currentPlayer].inAir;
		// 				SplitTime.player[SplitTime.currentPlayer].path.x[0] = SplitTime.player[SplitTime.currentPlayer].ix;
		// 				SplitTime.player[SplitTime.currentPlayer].path.y[0] = SplitTime.player[SplitTime.currentPlayer].iy;
		// 			}
		// 			SplitTime.player[SplitTime.currentPlayer].y -= 64;
		// 		}
		// 	}
		// 	else if(SplitTime.player[SplitTime.currentPlayer].actCountdown >= -32)
		// 	{
		// 		SplitTime.player[SplitTime.currentPlayer].y += 2*(SplitTime.player[SplitTime.currentPlayer].actCountdown + 32);
		// 		zeldaBump(SplitTime.player[SplitTime.currentPlayer], 8, 3);
		// 		SplitTime.player[SplitTime.currentPlayer].y -= 2*(SplitTime.player[SplitTime.currentPlayer].actCountdown + 32);
		// 		//SplitTime.player[SplitTime.currentPlayer].y++;
		// 	}
		// 	else
		// 	{
		// 		delete SplitTime.player[SplitTime.currentPlayer].act;
		// 		delete SplitTime.player[SplitTime.currentPlayer].inAir;
		// 	}
		// 	SplitTime.player[SplitTime.currentPlayer].actCountdown -= 4;
		// }
		// else if(SplitTime.player[SplitTime.currentPlayer].act == "homing")
		// {
		// 	var done = 0;
		// 	zeldaLockOnPoint(SplitTime.player[SplitTime.currentPlayer], SplitTime.player[SplitTime.currentPlayer].target.x, SplitTime.player[SplitTime.currentPlayer].target.y); //Lock direction on target
		// 	var dist = Math.sqrt(Math.pow(SplitTime.player[SplitTime.currentPlayer].target.x - SplitTime.player[SplitTime.currentPlayer].x, 2) + Math.pow(SplitTime.player[SplitTime.currentPlayer].target.y - SplitTime.player[SplitTime.currentPlayer].y, 2))
		// 	if(dist <= 32) //If closing in, knock back target
		// 	{
		// 		var tDir = SplitTime.player[SplitTime.currentPlayer].target.dir;
		// 		SplitTime.player[SplitTime.currentPlayer].target.dir = SplitTime.player[SplitTime.currentPlayer].dir;
		// 		zeldaStep(SplitTime.player[SplitTime.currentPlayer].target, 32);
		// 		SplitTime.player[SplitTime.currentPlayer].target.dir = tDir;
		// 		SplitTime.player[SplitTime.currentPlayer].target.status = "stunned"; //stun
		// 		delete SplitTime.player[SplitTime.currentPlayer].target.act; //stop action (e.g. slashing)
		// 		SplitTime.player[SplitTime.currentPlayer].target.statusCountdown = 100;
		// 		done = 1;
		// 	}
		// 	if(zeldaStep(SplitTime.player[SplitTime.currentPlayer], 32) == -1 || done == 1)
		// 	{
		// 		delete SplitTime.player[SplitTime.currentPlayer].target;
		// 		delete SplitTime.player[SplitTime.currentPlayer].inAir;
		// 		delete SplitTime.player[SplitTime.currentPlayer].status;
		// 		delete SplitTime.player[SplitTime.currentPlayer].act;
		// 	}
		// 	// pathMotion(SplitTime.player[SplitTime.currentPlayer], 32);
		// }
	// }
	if(person.path.length === 0)
	{
		if(SplitTime.figurePlayerDirection()) //If pressing direction(s), step
		{
			person.requestStance("walk");
			// if(SplitTime.player[SplitTime.currentPlayer].act == "jumping" && SplitTime.player[SplitTime.currentPlayer].inAir == 1 && SplitTime.player[SplitTime.currentPlayer].actCountdown < 0) SplitTime.player[SplitTime.currentPlayer].y += 2*(SplitTime.player[SplitTime.currentPlayer].actCountdown + 32);
			if(person.zeldaStep(person.spd) < 0) {}//console.log("stopped");
			// if(SplitTime.player[SplitTime.currentPlayer].act == "jumping" && SplitTime.player[SplitTime.currentPlayer].inAir == 1 && SplitTime.player[SplitTime.currentPlayer].actCountdown < 0) SplitTime.player[SplitTime.currentPlayer].y -= 2*(SplitTime.player[SplitTime.currentPlayer].actCountdown + 32);
		}
		else
		{
			person.defaultStance();
		}
		var limit = person.baseLength/2;
		for(var ind = -limit; ind < limit; ind++)
		{
			for(var sec = -limit; sec < limit; sec++)
			{
				i = SplitTime.pixCoordToIndex(SplitTime.player[SplitTime.currentPlayer].x + sec, SplitTime.player[SplitTime.currentPlayer].y + ind, SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer]);
				if(SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[i] == 100)
				{
					SplitTime.player[SplitTime.currentPlayer].onPrg = SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[i + 2];
					resumeFunc = SplitTime.currentLevel.boardProgram[SplitTime.player[SplitTime.currentPlayer].onPrg];
					if(SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[i + 1] == 1)
					{
						if(SplitTime.player[SplitTime.currentPlayer].wasOnPrg != SplitTime.player[SplitTime.currentPlayer].onPrg) //ensure program is not run twice
						{
							resumeCue = SplitTime.currentLevel.boardProgram[SplitTime.player[SplitTime.currentPlayer].onPrg](0);
						}
						//alert("program");
					}
					else if(SplitTime.currentLevel.layerFuncData[SplitTime.player[SplitTime.currentPlayer].layer].data[i + 1] == 2)
					{
						if(SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space") //require ENTER or SPACE to run program
						{
							delete SplitTime.keyFirstDown;
							resumeCue = SplitTime.currentLevel.boardProgram[SplitTime.player[SplitTime.currentPlayer].onPrg](0);
						}
					}
					else //Just run program if on
					{
						resumeCue = SplitTime.currentLevel.boardProgram[SplitTime.player[SplitTime.currentPlayer].onPrg](0);
					}
					ind = 9;
					sec = 17;
				}
			}
		}
		SplitTime.player[SplitTime.currentPlayer].wasOnPrg = SplitTime.player[SplitTime.currentPlayer].onPrg;
		SplitTime.player[SplitTime.currentPlayer].onPrg = -1;
	}
	else
	{
		person.updateFrame();
		person.pathMotion(person.spd);
	}

	//Pet motion
	// if(SplitTime.player[SplitTime.currentPlayer].pet != null) //If pet is in use
	// {
	// 	if(SplitTime.player[SplitTime.currentPlayer].pet.status == "active") //If pet is in active state
	// 	{
	// 		delete SplitTime.player[SplitTime.currentPlayer].pet.target; //reset target
	// 		var tDist = 97; //initialize currently closest distance
	// 		for(var index = 0; index < boardNPC.length; index++) //Cycle through boardNPC to determine closest one to SplitTime.player within 64 pixels
	// 		{
	// 			var dist = Math.sqrt(Math.pow(boardNPC[index].x - SplitTime.player[SplitTime.currentPlayer].x, 2) + Math.pow(boardNPC[index].y - SplitTime.player[SplitTime.currentPlayer].y, 2));
	// 			if(dist <= 96 && SplitTime.player[SplitTime.currentPlayer].layer == boardNPC[index].layer)
	// 			{
	// 				if(SplitTime.player[SplitTime.currentPlayer].pet.target == null || dist < tDist)
	// 				{
	// 					SplitTime.player[SplitTime.currentPlayer].pet.target = boardNPC[index];
	// 					tDist = dist;
	// 				}
	// 			}
	// 		}
	// 		if(SplitTime.player[SplitTime.currentPlayer].pet.target != null) //If target was found
	// 		{
	// 			zeldaLockOnPoint(SplitTime.player[SplitTime.currentPlayer].pet, SplitTime.player[SplitTime.currentPlayer].pet.target.x, SplitTime.player[SplitTime.currentPlayer].pet.target.y); //Orient pet toward target
	// 			zeldaStep(SplitTime.player[SplitTime.currentPlayer].pet, SplitTime.player[SplitTime.currentPlayer].spd + 2); //Step toward target
	// 			//Start slashing as fast as possible
	// 			if(SplitTime.player[SplitTime.currentPlayer].pet.rcvr == 0 && SplitTime.player[SplitTime.currentPlayer].pet.act != "slash")
	// 			{
	// 				SplitTime.player[SplitTime.currentPlayer].pet.act = "slash";
	// 				SplitTime.player[SplitTime.currentPlayer].pet.actCountdown = 4;
	// 			}
	// 			else if(SplitTime.player[SplitTime.currentPlayer].pet.rcvr != 0)
	// 			{
	// 				SplitTime.player[SplitTime.currentPlayer].pet.rcvr--;
	// 				if(SplitTime.player[SplitTime.currentPlayer].pet.rcvr < 0)
	// 				{
	// 					SplitTime.player[SplitTime.currentPlayer].pet.rcvr = 0;
	// 				}
	// 			}
	// 		}
	// 		else if(SplitTime.keyDown[73]) //Move toward SplitTime.player if not attacking and I is pressed
	// 		{
	// 			zeldaLockOnPoint(SplitTime.player[SplitTime.currentPlayer].pet, SplitTime.player[SplitTime.currentPlayer].x, SplitTime.player[SplitTime.currentPlayer].y);
	// 			zeldaStep(SplitTime.player[SplitTime.currentPlayer].pet, SplitTime.player[SplitTime.currentPlayer].spd - 2);
	// 		}
	// 		else
	// 		{
	// 			if(SLVD.randomInt(50) == 1)
	// 			{
	// 				SplitTime.player[SplitTime.currentPlayer].pet.dir = SLVD.randomInt(4) - 1;
	// 				zeldaStep(SplitTime.player[SplitTime.currentPlayer].pet, 1);
	// 			}
	// 		}
	// 		//Update frame
	// 		if(SplitTime.frameClock == 1) SplitTime.player[SplitTime.currentPlayer].pet.frame = (SplitTime.player[SplitTime.currentPlayer].pet.frame + 1)%4;
	// 		//Trend toward inactivity
	// 		SplitTime.player[SplitTime.currentPlayer].pet.statusCountdown--;
	// 		if(SplitTime.player[SplitTime.currentPlayer].pet.statusCountdown <= 0)
	// 		{
	// 			SplitTime.player[SplitTime.currentPlayer].pet.status = "inactive";
	// 			SplitTime.player[SplitTime.currentPlayer].pet.statusCountdown = 50;
	// 		}
	// 	}
	// 	else
	// 	{
	// 		SplitTime.player[SplitTime.currentPlayer].pet.statusCountdown--;
	// 		if(SplitTime.player[SplitTime.currentPlayer].pet.statusCountdown <= 0)
	// 		{
	// 			SplitTime.deleteBoardC(SplitTime.player[SplitTime.currentPlayer].pet);
	// 			delete SplitTime.player[SplitTime.currentPlayer].pet;
	// 		}
	// 	}
	// }

	//Projectile motion
	// if(SplitTime.player[SplitTime.currentPlayer].dart.img != null && SplitTime.player[SplitTime.currentPlayer].dart.layer != null)
	// {
	// 	//Move projectile
	// 	var moved = zeldaStep(SplitTime.player[SplitTime.currentPlayer].dart, SplitTime.player[SplitTime.currentPlayer].dart.spd);
	// 	for(var index = 0; index < boardNPC.length; index++)
	// 	{
	// 		if((Math.abs(SplitTime.player[SplitTime.currentPlayer].dart.y - (boardNPC[index].y - 24)) < 32) && (Math.abs(SplitTime.player[SplitTime.currentPlayer].dart.x - boardNPC[index].x) < 16))
	// 		{
	// 			SplitTime.damage(SplitTime.player[SplitTime.currentPlayer].dart, boardNPC[index]); //damage hit opponent
	// 			SplitTime.player[SplitTime.currentPlayer].dart.setLayer(null); //remove SplitTime.image
	// 			SplitTime.player[SplitTime.currentPlayer].dart.frame = 0; //reset frame
	// 			SplitTime.deleteBoardC(SplitTime.player[SplitTime.currentPlayer].dart);
	// 			boardNPC[index].status = "hurt"; //"hurt" opponent
	// 			boardNPC[index].statusCountdown = 4; //"hurt" blinks
	// 			index = boardNPC.length; //break out of loop
	// 		}
	// 	}
	// 	//If hit terrain
	// 	if(moved == -1)
	// 	{
	// 		SplitTime.player[SplitTime.currentPlayer].dart.setLayer(null);
	// 		SplitTime.player[SplitTime.currentPlayer].dart.frame = 0;
	// 		SplitTime.deleteBoardC(SplitTime.player[SplitTime.currentPlayer].dart);
	// 	}
	// 	//Update frame
	// 	if(SplitTime.frameClock == 1)
	// 	{
	// 		SplitTime.player[SplitTime.currentPlayer].dart.frame = (SplitTime.player[SplitTime.currentPlayer].dart.frame + 1)%4;
	// 	}
	// }
};
