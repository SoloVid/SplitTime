var SLVDE.PF = new Object();

SLVDE.pathToTeam = function(finder, opTeam)
{
	//alert("start pf");
	SLVDE.PF.finder = finder;
	SLVDE.PF.opTeam = opTeam;
	SLVDE.PF.point = new Array();
	SLVDE.PF.binHeap = new Array();
	SLVDE.PF.pointC = new Object;
	SLVDE.PF.SLVDE.counter = 0;
	//Start with finder's point
	//Convert to tile coordinates
	SLVDE.PF.pointC.x = SLVDE.xPixToTile(SLVDE.PF.finder.x);
	SLVDE.PF.pointC.y = SLVDE.yPixToTile(SLVDE.PF.finder.y);
	//Get index (based on SLVDE.level's function SLVDE.map data) of the point
	SLVDE.PF.pointC.index = SLVDE.pixCoordToIndex(SLVDE.PF.pointC.x, SLVDE.PF.pointC.y, SLVDE.currentLevel.layerFuncData[SLVDE.PF.finder.layer]);
	//No parent
	SLVDE.PF.pointC.parent = -1;
	//Initial point costs nothing
	SLVDE.PF.pointC.GCost = 0;
	//Set this point in a more concrete variable
	SLVDE.PF.point[SLVDE.PF.pointC.index] = SLVDE.PF.pointC;
	//Add point to the "closed list" (location -1)
	SLVDE.PF.pointC.location = -1;
	var cont = 1;
	while(cont == 1)
	{
		//if(SLVDE.PF.SLVDE.counter > 1000) alert("way too many while loopings");
		//alert(SLVDE.PF.pointC.x + ", " + SLVDE.PF.pointC.y);
		//Cycle through opposing team positions
		for(var index = 0; index < SLVDE.PF.opTeam.length; index++)
		{
			//if(index > 100) alert("something is wrong");
			//If reached one opponent's position, set path to troop
			if(SLVDE.PF.pointC.x == SLVDE.xPixToTile(SLVDE.PF.opTeam[index].x) && SLVDE.PF.pointC.y == SLVDE.yPixToTile(SLVDE.PF.opTeam[index].y))
			{
				//alert("found target");
				//Check if spot next to target is already occupied by team member
/*				for(var second = 0; second < SLVDE.PF.opTeam[0].oppTeam.length; second++)
				{
					//If found a team member, but it is the finder
					if(SLVDE.PF.opTeam[0].oppTeam[second] == SLVDE.PF.finder) { }
					else if(SLVDE.PF.pointC.parent.x == SLVDE.xPixToTile(SLVDE.PF.opTeam[0].oppTeam[second].x) && SLVDE.PF.pointC.parent.y == SLVDE.yPixToTile(SLVDE.PF.opTeam[0].oppTeam[second].y))
					{
						//Pretend the target's point has not been touched
						//SLVDE.PF.removeOb(SLVDE.PF.pointC.location); //Point is already out of the heap since it was grabbed.
						delete SLVDE.PF.point[SLVDE.PF.pointC.index];
						//Skip everything else to grab a new point
						SLVDE.PF.skip = 1;
						second = SLVDE.PF.opTeam[0].oppTeam.length;
					}
				}*/
//				if(SLVDE.PF.skip != 1)
	//			{
					//Go backward from target troop's point to finder's point, setting the path along the way
					while(SLVDE.PF.pointC.parent != -1)
					{
						for(var second = SLVDE.PF.finder.path.x.length; second > 0; second--)
						{
							SLVDE.PF.finder.path.x[second] = SLVDE.PF.finder.path.x[second - 1];
							SLVDE.PF.finder.path.y[second] = SLVDE.PF.finder.path.y[second - 1];
						}
						SLVDE.PF.finder.path.x[0] = SLVDE.xTileToPix(SLVDE.PF.pointC.x);
						SLVDE.PF.finder.path.y[0] = SLVDE.yTileToPix(SLVDE.PF.pointC.y);
						SLVDE.PF.pointC = SLVDE.PF.pointC.parent;
					}
					//Because the last child point is the point of the target, we delete it off to keep from going there
					SLVDE.PF.finder.path.x.length--;
					SLVDE.PF.finder.path.y.length--;
					//If the path is longer than the finder's speed, shorten it to the speed/* + 1 (account for the fact that the first point is its current point)*/
					if(SLVDE.PF.finder.path.x.length > SLVDE.PF.finder.spd)
					{
						SLVDE.PF.finder.path.x.length = SLVDE.PF.finder.spd;
						SLVDE.PF.finder.path.y.length = SLVDE.PF.finder.spd;
					}
					//index = SLVDE.PF.opTeam.length;
					cont = null;
					delete SLVDE.PF.point;
					delete SLVDE.PF.pointC;
					delete SLVDE.PF.binHeap;
					delete SLVDE.PF.skip;
					return SLVDE.PF.opTeam[index];
//				}
/*				else
				{
					index = SLVDE.PF.opTeam.length;
				}*/
			}
		}
		//alert("through for for opponents");
		if(SLVDE.PF.skip != 1)
		{
			SLVDE.PF.evaluatePoint(SLVDE.PF.pointC.x, SLVDE.PF.pointC.y - 1); //North of current point
			SLVDE.PF.evaluatePoint(SLVDE.PF.pointC.x, SLVDE.PF.pointC.y + 1); //South
			SLVDE.PF.evaluatePoint(SLVDE.PF.pointC.x + 1, SLVDE.PF.pointC.y); //East
			SLVDE.PF.evaluatePoint(SLVDE.PF.pointC.x - 1, SLVDE.PF.pointC.y); //West
		}
		else
		{
			//alert("skipped");
		}
		if(SLVDE.PF.binHeap[1] == null)
		{
			//alert("no path");
			//No path
			cont = null;
		}
		else if(SLVDE.PF.binHeap[1].GCost > (5*SLVDE.PF.finder.spd + 1)) //Too far
		{
			//alert("out of range");
			cont = null;
		}
		else
		{
		//alert("to grab");
			SLVDE.PF.pointC = SLVDE.PF.grabOb(); //grab from binary heap SLVDE.PF.binHeap
			//alert("from grab");
			SLVDE.PF.pointC.location = -1; //Add to "closed list"
		}
		delete SLVDE.PF.skip;
	}
	delete SLVDE.PF.point;
	delete SLVDE.PF.pointC;
	delete SLVDE.PF.binHeap;
	return -1;
//alert("through pf");
	//select lowest G cost
	//add to closed list, use as reference point
	//add surroundings to open list (if not already) (and if not blocked)
	//if surrounding already added, check for if lower G cost
};

SLVDE.PF.evaluatePoint = function(x, y)
{
	//alert("evaluating" + x + ", " + y);
	//Get point's index
	var i = SLVDE.pixCoordToIndex(x, y, SLVDE.currentLevel.layerFuncData[SLVDE.PF.finder.layer]);
	//If the point has not yet been analyzed and spot on SLVDE.map = function is not blocked
	if(SLVDE.PF.point[i] == null && SLVDE.currentLevel.layerFuncData[SLVDE.PF.finder.layer].data[i] != 255 && x >= 0 && y >= 0 && x < SLVDE.currentLevel.layerFunc[SLVDE.PF.finder.layer].width && y < SLVDE.currentLevel.layerFunc[SLVDE.PF.finder.layer].height)
	{
		//alert("initializing point " + i);
	//alert("setup point");
		//Set up point (as with first point)
		SLVDE.PF.point[i] = new Object;
		SLVDE.PF.point[i].x = x;
		SLVDE.PF.point[i].y = y;
		SLVDE.PF.point[i].index = i;
		SLVDE.PF.point[i].parent = SLVDE.PF.pointC;
		//GCost is one more than parent
		SLVDE.PF.point[i].GCost = SLVDE.PF.pointC.GCost + 1;
	//alert("have set properties");
		//add SLVDE.PF.point[i] to binHeap based on .GCost and set .location to place in binHeap
		//alert("adding");
		SLVDE.PF.addOb(SLVDE.PF.point[i]);
		//alert("add out");
		//alert("point to heap done");
	}
	else if(SLVDE.currentLevel.layerFuncData[SLVDE.PF.finder.layer].data[i] == 255 || x < 0 || y < 0 || x >= SLVDE.currentLevel.layerFunc[SLVDE.PF.finder.layer].width || y >= SLVDE.currentLevel.layerFunc[SLVDE.PF.finder.layer].height) //If point is on closed list or is blocked by terrain
	{ 
	//alert("blocked");
	} 
	else if(SLVDE.PF.point[i].location == -1) 
	{ 
	//	alert("closed");
	}
	else
	{
	//alert("already on open list");
		//Compare point's current GCost to its would-be GCost if parent were pointC
		if(SLVDE.PF.point[i].GCost > SLVDE.PF.pointC.GCost + 1)
		{
			//Switch point's parent to pointC
			SLVDE.PF.point[i].parent = SLVDE.PF.pointC;
			//Update point's GCost
			SLVDE.PF.point[i].GCost = SLVDE.PF.pointC.GCost + 1;
			//reposition SLVDE.PF.point[i] in binHeap based on .GCost
			//alert("relocating");
			SLVDE.PF.relocateOb(i);
			//alert("done relocating");
		}
	}
};

//Place a point in the binHeap
SLVDE.PF.addOb = function(ob)
{
	//Set point as cChild at end of heap
	//cChild is an index of the point
	var cChild = SLVDE.PF.binHeap.length;
	if(cChild == 0) cChild = 1;
	SLVDE.PF.binHeap[cChild] = ob;
	var cont2 = 1;
	while(cont2 == 1)
	{
		//alert("in addOb while");
		//Determine parent index
		var parent = (cChild - cChild%2)/2;
		//If the parent has a higher GCost than the child
		if(SLVDE.PF.binHeap[parent] == null) 
		{
			cont2 = null;
		}
		else if(SLVDE.PF.binHeap[parent].GCost > SLVDE.PF.binHeap[cChild].GCost)
		{
			//Switch the two
			SLVDE.PF.binHeap[cChild] = SLVDE.PF.binHeap[parent];
			//Update the was-parent, now-child location so it may be found easily
			SLVDE.PF.binHeap[cChild].location = cChild;
			//Make point the parent
			SLVDE.PF.binHeap[parent] = ob;
			//If at top of heap, stop
			if(parent == 1)
			{
				cont2 = null;
			}
			//cChild is now where parent had been
			cChild = parent;
		}
		else { cont2 = null; }; //If heap is valid, stop
	}
	//Save last two points' locations for easy access
	if(SLVDE.PF.binHeap[parent] != null)
	{
		SLVDE.PF.binHeap[parent].location = parent;
	}
	SLVDE.PF.binHeap[cChild].location = cChild;
}

//Grab the top object (lowest GCost) off of SLVDE.PF.binHeap
SLVDE.PF.grabOb = function()
{
	//Grab top object off of heap for return
	var ret = SLVDE.PF.binHeap[1];
	//Bring last object to top of heap
	SLVDE.PF.binHeap[1] = SLVDE.PF.binHeap[SLVDE.PF.binHeap.length - 1];
	//Obliterate last object (since it has been moved)
	SLVDE.PF.binHeap.length--;
	//Set first parent for comparison
	var parent = 1;
	//Initiate while loop
	var cont2 = 1;
	while(cont2 == 1)
	{
		//Determine first child of parent
		cChild = parent*2;
		if(SLVDE.PF.binHeap[cChild] != null)
		{
			//If second child has lower GCost than first child, make second child the one in consideration; but first make sure there is a second child
			if(SLVDE.PF.binHeap[cChild + 1] != null)
			{
				if(SLVDE.PF.binHeap[cChild].GCost > SLVDE.PF.binHeap[cChild + 1].GCost)
				{
					cChild++;
				}
			}
			//If the parent's GCost is greater than the child's GCost, reverse relationship
			if(SLVDE.PF.binHeap[parent].GCost > SLVDE.PF.binHeap[cChild].GCost)
			{	
				var temp = SLVDE.PF.binHeap[parent];
				SLVDE.PF.binHeap[parent] = SLVDE.PF.binHeap[cChild];
				SLVDE.PF.binHeap[cChild] = temp;
				//Save location in object (so it may be accessed elsewhere)
				SLVDE.PF.binHeap[parent].location = parent;
				//If at end of heap (cChild has no children), stop loop
				if((cChild*2) >= SLVDE.PF.binHeap.length)
				{
					cont2 = null;
				}
/*				else
				{*/
					//Move down heap
					parent = cChild;
//				}
			}
			else //Heap is valid
			{
				//Save location
				SLVDE.PF.binHeap[parent].location = parent;
				//End loop
				cont2 = null; 
			}
		}
		else
		{
			cont2 = null;
		}
	}
	//Save location for backwards finding
	SLVDE.PF.binHeap[parent].location = parent;
	//SLVDE.PF.binHeap[cChild].location = cChild;
	//Return grabbed top object
	return ret;
}

//Occasionally, an object must be removed from the heap (right now just when a path is found to the target but the spot next to the target already has a teammate).
SLVDE.PF.removeOb = function(index)
{
	//If object is last object, simply shorten the heap
	if(index == SLVDE.PF.binHeap.length - 1)
	{
		SLVDE.PF.binHeap.length--;
		return 1;
	}
	//Bring last object to place of removed object
	SLVDE.PF.binHeap[index] = SLVDE.PF.binHeap[SLVDE.PF.binHeap.length - 1];
	//Obliterate last object (since it has been moved)
	SLVDE.PF.binHeap.length--;
	//Set first parent for comparison
	var parent = index;
	//Initiate while loop
	var cont2 = 1;
	var times = 0;
	while(cont2 == 1)
	{
		//alert(times);
		//Determine first child of parent
		cChild = parent*2;
		//If child exists
		if(SLVDE.PF.binHeap[cChild] != null)
		{
			//If second child has lower GCost than first child, make second child the one in consideration; but first make sure there is a second child
			if(SLVDE.PF.binHeap[cChild + 1] != null)
			{
				if(SLVDE.PF.binHeap[cChild].GCost > SLVDE.PF.binHeap[cChild + 1].GCost)
				{
					cChild++;
				}
			}
			//If the parent's GCost is greater than the child's GCost, reverse relationship
			if(SLVDE.PF.binHeap[parent].GCost > SLVDE.PF.binHeap[cChild].GCost)
			{	
				var temp = SLVDE.PF.binHeap[parent];
				SLVDE.PF.binHeap[parent] = SLVDE.PF.binHeap[cChild];
				SLVDE.PF.binHeap[cChild] = temp;
				//Save location in object (so it may be accessed elsewhere)
				SLVDE.PF.binHeap[parent].location = parent;
				//If at end of heap (cChild has no children), stop loop
				if((cChild*2) >= SLVDE.PF.binHeap.length)
				{
					cont2 = null;
				}
/*				else
				{*/
					//Move down heap
					parent = cChild;
//				}
			}
			else //Heap is valid
			{
				//Save location
				SLVDE.PF.binHeap[parent].location = parent;
				//End loop
				cont2 = null; 
			}
		}
		else
		{
			cont2 = null;
		}
		times++;
	}
	//Save location for backwards finding
	SLVDE.PF.binHeap[parent].location = parent;
	//SLVDE.PF.binHeap[cChild].location = cChild;
	//alert(SLVDE.PF.binHeap[parent].location);
}

//Because of a changed GCost of a point, check and correct the heap's validity starting at that point's known location
SLVDE.PF.relocateOb = function(index)
{
	//If point is already at the top of the heap, end
	if(index == 1)
	{
		return 1;
	}
	//GCost of a point is only ever going to be decreased; thus we only need to check it going upward in the heap. Hence, the point is our first child
	var cChild = index;
	var cont2 = 1;
	while(cont2 == 1)
	{
		//Determine parent
		var parent = (cChild - cChild%2)/2;
		//If parent has greater GCost than child, switch them
		if(SLVDE.PF.binHeap[parent].GCost > SLVDE.PF.binHeap[cChild].GCost)
		{
			var temp = SLVDE.PF.binHeap[parent];
			SLVDE.PF.binHeap[parent] = SLVDE.PF.binHeap[cChild];
			SLVDE.PF.binHeap[cChild] = temp;
			//Since we are moving up the heap, the lower member is left behind and needs its location saved here
			SLVDE.PF.binHeap[cChild].location = cChild;
			//If at top of heap, stop
			if(parent == 1)
			{
				cont2 = null;
			}
			else
			{
				//Move up heap
				cChild = parent;
			}
		}
		else
		{
			//Final child stays (and so does final parent)
			SLVDE.PF.binHeap[cChild].location = cChild;
			cont2 = null;
		}
	}
}


//Get squares SLVDE.player can move to
SLVDE.PF.getSquares = function(person)
{
	//Make person accessible across functions
	SLVDE.PF.person = person;
	//Since person.squares is deleted every turn, re-setup the first square
	person.squares[0] = new Object;
	person.squares[0].x = SLVDE.xPixToTile(person.ix);
	person.squares[0].y = SLVDE.yPixToTile(person.iy);
	person.squares[0].GCost = 0;
	//Loop as long as there is another square to look at
	for(var index = 0; index < person.squares.length; index++)
	{
		//Square in question is...
		SLVDE.PF.cSquare = person.squares[index]
		SLVDE.PF.evaluateSquare(person.squares[index].x, person.squares[index].y - 1); //N
		SLVDE.PF.evaluateSquare(person.squares[index].x, person.squares[index].y + 1); //S
		SLVDE.PF.evaluateSquare(person.squares[index].x + 1, person.squares[index].y); //E
		SLVDE.PF.evaluateSquare(person.squares[index].x - 1, person.squares[index].y); //W
	}
	//Remove marked (teammate on) squares
/*	for(var index = 0; index < SLVDE.PF.person.squares.length; index++)
	{
		while(SLVDE.PF.person.squares[index].remove == 1)
		{
			for(var second = index; second < SLVDE.PF.person.squares.length; second++)
			{
				SLVDE.PF.person.squares[second] = SLVDE.PF.person.squares[second + 1];
			}
			SLVDE.PF.person.squares.length--;
		}
	}*/
}

SLVDE.PF.evaluateSquare = function(x, y)
{
	//Set some variables used in this function
	var done = 0;
	var blocked = 0;
	var forRemoval = 0;
	//Determine if square has already been analyzed.
	for(var second = 0; second < SLVDE.PF.person.squares.length; second++)
	{
		if(x == SLVDE.PF.person.squares[second].x && y == SLVDE.PF.person.squares[second].y)
		{
			done = 1;
			second = SLVDE.PF.person.squares.length;
		}
	}
	//If not analyzed
	if(done != 1)
	{
		//Determine if opponent is on the square.
		for(var second = 0; second < SLVDE.PF.person.oppTeam.length; second++)
		{
			if(SLVDE.xPixToTile(SLVDE.PF.person.oppTeam[second].x) == x && SLVDE.yPixToTile(SLVDE.PF.person.oppTeam[second].y) == y)
			{
				blocked = 1;
			}
		}
		//Determine if a teammate is on the square.
		for(var second = 0; second < SLVDE.PF.person.oppTeam[0].oppTeam.length; second++)
		{
			if(SLVDE.PF.person.oppTeam[0].oppTeam[second] == SLVDE.PF.person) { } //Exception: teammate is self.
			else if(SLVDE.xPixToTile(SLVDE.PF.person.oppTeam[0].oppTeam[second].x) == x && SLVDE.yPixToTile(SLVDE.PF.person.oppTeam[0].oppTeam[second].y) == y)
			{
				//This square is still a parent square but will be removed in the end.
				forRemoval = 1;
			}
		}
		if(SLVDE.currentLevel.layerFuncData[SLVDE.PF.person.layer].data[SLVDE.pixCoordToIndex(x, y, SLVDE.currentLevel.layerFuncData[SLVDE.PF.person.layer])] != 255 && blocked != 1)
		{
			if(SLVDE.PF.cSquare.GCost + 1 <= SLVDE.PF.person.spd)
			{
				var ref = SLVDE.PF.person.squares.length;
				SLVDE.PF.person.squares[ref] = new Object;
				SLVDE.PF.person.squares[ref].x = x;
				SLVDE.PF.person.squares[ref].y = y;
				SLVDE.PF.person.squares[ref].GCost = SLVDE.PF.cSquare.GCost + 1;
				if(forRemoval == 1)
				{
					SLVDE.PF.person.squares[ref].remove = 1;
				}
			}
		}
	}
}

SLVDE.PF.onSquare = function(person)
{
	for(var index = 0; index < person.squares.length; index++)
	{
		if(person.squares[index].x == SLVDE.xPixToTile(person.x) && person.squares[index].y == SLVDE.yPixToTile(person.y))
		{
			return 1;
		}
	}
	return 0;
}
 //Check if a coordinate is a square
SLVDE.PF.isSquare = function(x, y, person)
{
	for(var index = 0; index < person.squares.length; index++)
	{
		if(person.squares[index].x == SLVDE.xPixToTile(x) && person.squares[index].y == SLVDE.yPixToTile(y))
		{
			return 1;
		}
	}
	return 0;
}

SLVDE.PF.reformUnitsOnSquareWithout = function(x, y, team, exMember)
{
	var unit = new Array;
	unit.length = 0;
	for(var index = 0; index < team.length; index++)
	{
		if(SLVDE.xPixToTile(team[index].x) == x && SLVDE.yPixToTile(team[index].y) == y && team[index] != exMember) unit[unit.length] = team[index];
	}
	if(unit.length == 1)
	{
		unit[0].x = SLVDE.xTileToPix(x);
		unit[0].y = SLVDE.yTileToPix(y);
	}
	else
	{
		try
		{
			unit[0].x = SLVDE.xTileToPix(x) - 8;
			unit[0].y = SLVDE.yTileToPix(y) + 8;
			unit[1].x = SLVDE.xTileToPix(x) + 8;
			unit[1].y = SLVDE.yTileToPix(y) - 8;
			unit[2].x = SLVDE.xTileToPix(x) - 8;
			unit[2].y = SLVDE.yTileToPix(y) - 8;
			unit[3].x = SLVDE.xTileToPix(x) + 8;
			unit[3].y = SLVDE.yTileToPix(y) + 8;
			unit[4].x = SLVDE.xTileToPix(x) - 0;
			unit[4].y = SLVDE.yTileToPix(y) + 0;
		}
		catch(e)
		{
			return 0;
		}
	}
}