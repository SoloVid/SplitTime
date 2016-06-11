var SplitTime.PF = new Object();

SplitTime.pathToTeam = function(finder, opTeam)
{
	//alert("start pf");
	SplitTime.PF.finder = finder;
	SplitTime.PF.opTeam = opTeam;
	SplitTime.PF.point = new Array();
	SplitTime.PF.binHeap = new Array();
	SplitTime.PF.pointC = new Object;
	SplitTime.PF.SplitTime.counter = 0;
	//Start with finder's point
	//Convert to tile coordinates
	SplitTime.PF.pointC.x = SplitTime.xPixToTile(SplitTime.PF.finder.x);
	SplitTime.PF.pointC.y = SplitTime.yPixToTile(SplitTime.PF.finder.y);
	//Get index (based on SplitTime.level's function SplitTime.map data) of the point
	SplitTime.PF.pointC.index = SplitTime.pixCoordToIndex(SplitTime.PF.pointC.x, SplitTime.PF.pointC.y, SplitTime.currentLevel.layerFuncData[SplitTime.PF.finder.layer]);
	//No parent
	SplitTime.PF.pointC.parent = -1;
	//Initial point costs nothing
	SplitTime.PF.pointC.GCost = 0;
	//Set this point in a more concrete variable
	SplitTime.PF.point[SplitTime.PF.pointC.index] = SplitTime.PF.pointC;
	//Add point to the "closed list" (location -1)
	SplitTime.PF.pointC.location = -1;
	var cont = 1;
	while(cont == 1)
	{
		//if(SplitTime.PF.SplitTime.counter > 1000) alert("way too many while loopings");
		//alert(SplitTime.PF.pointC.x + ", " + SplitTime.PF.pointC.y);
		//Cycle through opposing team positions
		for(var index = 0; index < SplitTime.PF.opTeam.length; index++)
		{
			//if(index > 100) alert("something is wrong");
			//If reached one opponent's position, set path to troop
			if(SplitTime.PF.pointC.x == SplitTime.xPixToTile(SplitTime.PF.opTeam[index].x) && SplitTime.PF.pointC.y == SplitTime.yPixToTile(SplitTime.PF.opTeam[index].y))
			{
				//alert("found target");
				//Check if spot next to target is already occupied by team member
/*				for(var second = 0; second < SplitTime.PF.opTeam[0].oppTeam.length; second++)
				{
					//If found a team member, but it is the finder
					if(SplitTime.PF.opTeam[0].oppTeam[second] == SplitTime.PF.finder) { }
					else if(SplitTime.PF.pointC.parent.x == SplitTime.xPixToTile(SplitTime.PF.opTeam[0].oppTeam[second].x) && SplitTime.PF.pointC.parent.y == SplitTime.yPixToTile(SplitTime.PF.opTeam[0].oppTeam[second].y))
					{
						//Pretend the target's point has not been touched
						//SplitTime.PF.removeOb(SplitTime.PF.pointC.location); //Point is already out of the heap since it was grabbed.
						delete SplitTime.PF.point[SplitTime.PF.pointC.index];
						//Skip everything else to grab a new point
						SplitTime.PF.skip = 1;
						second = SplitTime.PF.opTeam[0].oppTeam.length;
					}
				}*/
//				if(SplitTime.PF.skip != 1)
	//			{
					//Go backward from target troop's point to finder's point, setting the path along the way
					while(SplitTime.PF.pointC.parent != -1)
					{
						for(var second = SplitTime.PF.finder.path.x.length; second > 0; second--)
						{
							SplitTime.PF.finder.path.x[second] = SplitTime.PF.finder.path.x[second - 1];
							SplitTime.PF.finder.path.y[second] = SplitTime.PF.finder.path.y[second - 1];
						}
						SplitTime.PF.finder.path.x[0] = SplitTime.xTileToPix(SplitTime.PF.pointC.x);
						SplitTime.PF.finder.path.y[0] = SplitTime.yTileToPix(SplitTime.PF.pointC.y);
						SplitTime.PF.pointC = SplitTime.PF.pointC.parent;
					}
					//Because the last child point is the point of the target, we delete it off to keep from going there
					SplitTime.PF.finder.path.x.length--;
					SplitTime.PF.finder.path.y.length--;
					//If the path is longer than the finder's speed, shorten it to the speed/* + 1 (account for the fact that the first point is its current point)*/
					if(SplitTime.PF.finder.path.x.length > SplitTime.PF.finder.spd)
					{
						SplitTime.PF.finder.path.x.length = SplitTime.PF.finder.spd;
						SplitTime.PF.finder.path.y.length = SplitTime.PF.finder.spd;
					}
					//index = SplitTime.PF.opTeam.length;
					cont = null;
					delete SplitTime.PF.point;
					delete SplitTime.PF.pointC;
					delete SplitTime.PF.binHeap;
					delete SplitTime.PF.skip;
					return SplitTime.PF.opTeam[index];
//				}
/*				else
				{
					index = SplitTime.PF.opTeam.length;
				}*/
			}
		}
		//alert("through for for opponents");
		if(SplitTime.PF.skip != 1)
		{
			SplitTime.PF.evaluatePoint(SplitTime.PF.pointC.x, SplitTime.PF.pointC.y - 1); //North of current point
			SplitTime.PF.evaluatePoint(SplitTime.PF.pointC.x, SplitTime.PF.pointC.y + 1); //South
			SplitTime.PF.evaluatePoint(SplitTime.PF.pointC.x + 1, SplitTime.PF.pointC.y); //East
			SplitTime.PF.evaluatePoint(SplitTime.PF.pointC.x - 1, SplitTime.PF.pointC.y); //West
		}
		else
		{
			//alert("skipped");
		}
		if(SplitTime.PF.binHeap[1] == null)
		{
			//alert("no path");
			//No path
			cont = null;
		}
		else if(SplitTime.PF.binHeap[1].GCost > (5*SplitTime.PF.finder.spd + 1)) //Too far
		{
			//alert("out of range");
			cont = null;
		}
		else
		{
		//alert("to grab");
			SplitTime.PF.pointC = SplitTime.PF.grabOb(); //grab from binary heap SplitTime.PF.binHeap
			//alert("from grab");
			SplitTime.PF.pointC.location = -1; //Add to "closed list"
		}
		delete SplitTime.PF.skip;
	}
	delete SplitTime.PF.point;
	delete SplitTime.PF.pointC;
	delete SplitTime.PF.binHeap;
	return -1;
//alert("through pf");
	//select lowest G cost
	//add to closed list, use as reference point
	//add surroundings to open list (if not already) (and if not blocked)
	//if surrounding already added, check for if lower G cost
};

SplitTime.PF.evaluatePoint = function(x, y)
{
	//alert("evaluating" + x + ", " + y);
	//Get point's index
	var i = SplitTime.pixCoordToIndex(x, y, SplitTime.currentLevel.layerFuncData[SplitTime.PF.finder.layer]);
	//If the point has not yet been analyzed and spot on SplitTime.map = function is not blocked
	if(SplitTime.PF.point[i] == null && SplitTime.currentLevel.layerFuncData[SplitTime.PF.finder.layer].data[i] != 255 && x >= 0 && y >= 0 && x < SplitTime.currentLevel.layerFunc[SplitTime.PF.finder.layer].width && y < SplitTime.currentLevel.layerFunc[SplitTime.PF.finder.layer].height)
	{
		//alert("initializing point " + i);
	//alert("setup point");
		//Set up point (as with first point)
		SplitTime.PF.point[i] = new Object;
		SplitTime.PF.point[i].x = x;
		SplitTime.PF.point[i].y = y;
		SplitTime.PF.point[i].index = i;
		SplitTime.PF.point[i].parent = SplitTime.PF.pointC;
		//GCost is one more than parent
		SplitTime.PF.point[i].GCost = SplitTime.PF.pointC.GCost + 1;
	//alert("have set properties");
		//add SplitTime.PF.point[i] to binHeap based on .GCost and set .location to place in binHeap
		//alert("adding");
		SplitTime.PF.addOb(SplitTime.PF.point[i]);
		//alert("add out");
		//alert("point to heap done");
	}
	else if(SplitTime.currentLevel.layerFuncData[SplitTime.PF.finder.layer].data[i] == 255 || x < 0 || y < 0 || x >= SplitTime.currentLevel.layerFunc[SplitTime.PF.finder.layer].width || y >= SplitTime.currentLevel.layerFunc[SplitTime.PF.finder.layer].height) //If point is on closed list or is blocked by terrain
	{ 
	//alert("blocked");
	} 
	else if(SplitTime.PF.point[i].location == -1) 
	{ 
	//	alert("closed");
	}
	else
	{
	//alert("already on open list");
		//Compare point's current GCost to its would-be GCost if parent were pointC
		if(SplitTime.PF.point[i].GCost > SplitTime.PF.pointC.GCost + 1)
		{
			//Switch point's parent to pointC
			SplitTime.PF.point[i].parent = SplitTime.PF.pointC;
			//Update point's GCost
			SplitTime.PF.point[i].GCost = SplitTime.PF.pointC.GCost + 1;
			//reposition SplitTime.PF.point[i] in binHeap based on .GCost
			//alert("relocating");
			SplitTime.PF.relocateOb(i);
			//alert("done relocating");
		}
	}
};

//Place a point in the binHeap
SplitTime.PF.addOb = function(ob)
{
	//Set point as cChild at end of heap
	//cChild is an index of the point
	var cChild = SplitTime.PF.binHeap.length;
	if(cChild == 0) cChild = 1;
	SplitTime.PF.binHeap[cChild] = ob;
	var cont2 = 1;
	while(cont2 == 1)
	{
		//alert("in addOb while");
		//Determine parent index
		var parent = (cChild - cChild%2)/2;
		//If the parent has a higher GCost than the child
		if(SplitTime.PF.binHeap[parent] == null) 
		{
			cont2 = null;
		}
		else if(SplitTime.PF.binHeap[parent].GCost > SplitTime.PF.binHeap[cChild].GCost)
		{
			//Switch the two
			SplitTime.PF.binHeap[cChild] = SplitTime.PF.binHeap[parent];
			//Update the was-parent, now-child location so it may be found easily
			SplitTime.PF.binHeap[cChild].location = cChild;
			//Make point the parent
			SplitTime.PF.binHeap[parent] = ob;
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
	if(SplitTime.PF.binHeap[parent] != null)
	{
		SplitTime.PF.binHeap[parent].location = parent;
	}
	SplitTime.PF.binHeap[cChild].location = cChild;
}

//Grab the top object (lowest GCost) off of SplitTime.PF.binHeap
SplitTime.PF.grabOb = function()
{
	//Grab top object off of heap for return
	var ret = SplitTime.PF.binHeap[1];
	//Bring last object to top of heap
	SplitTime.PF.binHeap[1] = SplitTime.PF.binHeap[SplitTime.PF.binHeap.length - 1];
	//Obliterate last object (since it has been moved)
	SplitTime.PF.binHeap.length--;
	//Set first parent for comparison
	var parent = 1;
	//Initiate while loop
	var cont2 = 1;
	while(cont2 == 1)
	{
		//Determine first child of parent
		cChild = parent*2;
		if(SplitTime.PF.binHeap[cChild] != null)
		{
			//If second child has lower GCost than first child, make second child the one in consideration; but first make sure there is a second child
			if(SplitTime.PF.binHeap[cChild + 1] != null)
			{
				if(SplitTime.PF.binHeap[cChild].GCost > SplitTime.PF.binHeap[cChild + 1].GCost)
				{
					cChild++;
				}
			}
			//If the parent's GCost is greater than the child's GCost, reverse relationship
			if(SplitTime.PF.binHeap[parent].GCost > SplitTime.PF.binHeap[cChild].GCost)
			{	
				var temp = SplitTime.PF.binHeap[parent];
				SplitTime.PF.binHeap[parent] = SplitTime.PF.binHeap[cChild];
				SplitTime.PF.binHeap[cChild] = temp;
				//Save location in object (so it may be accessed elsewhere)
				SplitTime.PF.binHeap[parent].location = parent;
				//If at end of heap (cChild has no children), stop loop
				if((cChild*2) >= SplitTime.PF.binHeap.length)
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
				SplitTime.PF.binHeap[parent].location = parent;
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
	SplitTime.PF.binHeap[parent].location = parent;
	//SplitTime.PF.binHeap[cChild].location = cChild;
	//Return grabbed top object
	return ret;
}

//Occasionally, an object must be removed from the heap (right now just when a path is found to the target but the spot next to the target already has a teammate).
SplitTime.PF.removeOb = function(index)
{
	//If object is last object, simply shorten the heap
	if(index == SplitTime.PF.binHeap.length - 1)
	{
		SplitTime.PF.binHeap.length--;
		return 1;
	}
	//Bring last object to place of removed object
	SplitTime.PF.binHeap[index] = SplitTime.PF.binHeap[SplitTime.PF.binHeap.length - 1];
	//Obliterate last object (since it has been moved)
	SplitTime.PF.binHeap.length--;
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
		if(SplitTime.PF.binHeap[cChild] != null)
		{
			//If second child has lower GCost than first child, make second child the one in consideration; but first make sure there is a second child
			if(SplitTime.PF.binHeap[cChild + 1] != null)
			{
				if(SplitTime.PF.binHeap[cChild].GCost > SplitTime.PF.binHeap[cChild + 1].GCost)
				{
					cChild++;
				}
			}
			//If the parent's GCost is greater than the child's GCost, reverse relationship
			if(SplitTime.PF.binHeap[parent].GCost > SplitTime.PF.binHeap[cChild].GCost)
			{	
				var temp = SplitTime.PF.binHeap[parent];
				SplitTime.PF.binHeap[parent] = SplitTime.PF.binHeap[cChild];
				SplitTime.PF.binHeap[cChild] = temp;
				//Save location in object (so it may be accessed elsewhere)
				SplitTime.PF.binHeap[parent].location = parent;
				//If at end of heap (cChild has no children), stop loop
				if((cChild*2) >= SplitTime.PF.binHeap.length)
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
				SplitTime.PF.binHeap[parent].location = parent;
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
	SplitTime.PF.binHeap[parent].location = parent;
	//SplitTime.PF.binHeap[cChild].location = cChild;
	//alert(SplitTime.PF.binHeap[parent].location);
}

//Because of a changed GCost of a point, check and correct the heap's validity starting at that point's known location
SplitTime.PF.relocateOb = function(index)
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
		if(SplitTime.PF.binHeap[parent].GCost > SplitTime.PF.binHeap[cChild].GCost)
		{
			var temp = SplitTime.PF.binHeap[parent];
			SplitTime.PF.binHeap[parent] = SplitTime.PF.binHeap[cChild];
			SplitTime.PF.binHeap[cChild] = temp;
			//Since we are moving up the heap, the lower member is left behind and needs its location saved here
			SplitTime.PF.binHeap[cChild].location = cChild;
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
			SplitTime.PF.binHeap[cChild].location = cChild;
			cont2 = null;
		}
	}
}


//Get squares SplitTime.player can move to
SplitTime.PF.getSquares = function(person)
{
	//Make person accessible across functions
	SplitTime.PF.person = person;
	//Since person.squares is deleted every turn, re-setup the first square
	person.squares[0] = new Object;
	person.squares[0].x = SplitTime.xPixToTile(person.ix);
	person.squares[0].y = SplitTime.yPixToTile(person.iy);
	person.squares[0].GCost = 0;
	//Loop as long as there is another square to look at
	for(var index = 0; index < person.squares.length; index++)
	{
		//Square in question is...
		SplitTime.PF.cSquare = person.squares[index]
		SplitTime.PF.evaluateSquare(person.squares[index].x, person.squares[index].y - 1); //N
		SplitTime.PF.evaluateSquare(person.squares[index].x, person.squares[index].y + 1); //S
		SplitTime.PF.evaluateSquare(person.squares[index].x + 1, person.squares[index].y); //E
		SplitTime.PF.evaluateSquare(person.squares[index].x - 1, person.squares[index].y); //W
	}
	//Remove marked (teammate on) squares
/*	for(var index = 0; index < SplitTime.PF.person.squares.length; index++)
	{
		while(SplitTime.PF.person.squares[index].remove == 1)
		{
			for(var second = index; second < SplitTime.PF.person.squares.length; second++)
			{
				SplitTime.PF.person.squares[second] = SplitTime.PF.person.squares[second + 1];
			}
			SplitTime.PF.person.squares.length--;
		}
	}*/
}

SplitTime.PF.evaluateSquare = function(x, y)
{
	//Set some variables used in this function
	var done = 0;
	var blocked = 0;
	var forRemoval = 0;
	//Determine if square has already been analyzed.
	for(var second = 0; second < SplitTime.PF.person.squares.length; second++)
	{
		if(x == SplitTime.PF.person.squares[second].x && y == SplitTime.PF.person.squares[second].y)
		{
			done = 1;
			second = SplitTime.PF.person.squares.length;
		}
	}
	//If not analyzed
	if(done != 1)
	{
		//Determine if opponent is on the square.
		for(var second = 0; second < SplitTime.PF.person.oppTeam.length; second++)
		{
			if(SplitTime.xPixToTile(SplitTime.PF.person.oppTeam[second].x) == x && SplitTime.yPixToTile(SplitTime.PF.person.oppTeam[second].y) == y)
			{
				blocked = 1;
			}
		}
		//Determine if a teammate is on the square.
		for(var second = 0; second < SplitTime.PF.person.oppTeam[0].oppTeam.length; second++)
		{
			if(SplitTime.PF.person.oppTeam[0].oppTeam[second] == SplitTime.PF.person) { } //Exception: teammate is self.
			else if(SplitTime.xPixToTile(SplitTime.PF.person.oppTeam[0].oppTeam[second].x) == x && SplitTime.yPixToTile(SplitTime.PF.person.oppTeam[0].oppTeam[second].y) == y)
			{
				//This square is still a parent square but will be removed in the end.
				forRemoval = 1;
			}
		}
		if(SplitTime.currentLevel.layerFuncData[SplitTime.PF.person.layer].data[SplitTime.pixCoordToIndex(x, y, SplitTime.currentLevel.layerFuncData[SplitTime.PF.person.layer])] != 255 && blocked != 1)
		{
			if(SplitTime.PF.cSquare.GCost + 1 <= SplitTime.PF.person.spd)
			{
				var ref = SplitTime.PF.person.squares.length;
				SplitTime.PF.person.squares[ref] = new Object;
				SplitTime.PF.person.squares[ref].x = x;
				SplitTime.PF.person.squares[ref].y = y;
				SplitTime.PF.person.squares[ref].GCost = SplitTime.PF.cSquare.GCost + 1;
				if(forRemoval == 1)
				{
					SplitTime.PF.person.squares[ref].remove = 1;
				}
			}
		}
	}
}

SplitTime.PF.onSquare = function(person)
{
	for(var index = 0; index < person.squares.length; index++)
	{
		if(person.squares[index].x == SplitTime.xPixToTile(person.x) && person.squares[index].y == SplitTime.yPixToTile(person.y))
		{
			return 1;
		}
	}
	return 0;
}
 //Check if a coordinate is a square
SplitTime.PF.isSquare = function(x, y, person)
{
	for(var index = 0; index < person.squares.length; index++)
	{
		if(person.squares[index].x == SplitTime.xPixToTile(x) && person.squares[index].y == SplitTime.yPixToTile(y))
		{
			return 1;
		}
	}
	return 0;
}

SplitTime.PF.reformUnitsOnSquareWithout = function(x, y, team, exMember)
{
	var unit = new Array;
	unit.length = 0;
	for(var index = 0; index < team.length; index++)
	{
		if(SplitTime.xPixToTile(team[index].x) == x && SplitTime.yPixToTile(team[index].y) == y && team[index] != exMember) unit[unit.length] = team[index];
	}
	if(unit.length == 1)
	{
		unit[0].x = SplitTime.xTileToPix(x);
		unit[0].y = SplitTime.yTileToPix(y);
	}
	else
	{
		try
		{
			unit[0].x = SplitTime.xTileToPix(x) - 8;
			unit[0].y = SplitTime.yTileToPix(y) + 8;
			unit[1].x = SplitTime.xTileToPix(x) + 8;
			unit[1].y = SplitTime.yTileToPix(y) - 8;
			unit[2].x = SplitTime.xTileToPix(x) - 8;
			unit[2].y = SplitTime.yTileToPix(y) - 8;
			unit[3].x = SplitTime.xTileToPix(x) + 8;
			unit[3].y = SplitTime.yTileToPix(y) + 8;
			unit[4].x = SplitTime.xTileToPix(x) - 0;
			unit[4].y = SplitTime.yTileToPix(y) + 0;
		}
		catch(e)
		{
			return 0;
		}
	}
}