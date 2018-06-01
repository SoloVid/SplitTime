SplitTime.onBoard = {};
SplitTime.onBoard.agents = []; //NPCs and players, for functional interaction
SplitTime.onBoard.bodies = []; //NPCs, players, and props, for drawing purposes

//Sort all board characters into the array SplitTime.onBoard.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.onBoard.refetchBodies = function() {
	SplitTime.onBoard.agents.length = 0;
	SplitTime.onBoard.bodies.length = 0;
	var index;
	//Figure out which Actors are on board
	for(var id in SplitTime.Actor) {
		var actor = SplitTime.Actor[id];
		if(actor.lvl == SplitTime.currentLevel.id)
		{
			SplitTime.onBoard.agents.push(actor);
			SplitTime.onBoard.insertBody(actor);
		}
	}

	function putObjOnBoard(obj) {
		SplitTime.onBoard.insertBody(obj);
		var children = obj.getChildren();
		for(var i = 0; i < children.length; i++)
		{
			putObjOnBoard(children[i]);
		}
	}

	//Pull board objects from file
	for(index = 0; index < SplitTime.currentLevel.filedata.getElementsByTagName("prop").length; index++) {
		var prop = SplitTime.currentLevel.filedata.getElementsByTagName("prop")[index];
		var template = prop.getAttribute("template");

		var obj;
		if(template) {
			obj = new SplitTime.BodyTemplate[template]();
		}
		else {
			obj = new SplitTime.Body(null, null);
		}

		obj.id = prop.getAttribute("id");
		obj.setX(+prop.getAttribute("x"));
		obj.setY(+prop.getAttribute("y"));
		obj.setZ(+prop.getAttribute("layer"));
		obj.dir = +prop.getAttribute("dir");
		obj.stance = prop.getAttribute("stance");

		putObjOnBoard(obj);
	}

	for(index = 0; index < SplitTime.player.length; index++) {
		if(index == SplitTime.currentPlayer || SplitTime.currentLevel.type == "TRPG") {
			SplitTime.onBoard.agents.push(SplitTime.player[index]);
			SplitTime.onBoard.insertBody(SplitTime.player[index]);
		}
	}
};

//Sort the array SplitTime.onBoard.bodies in order of y location (in order to properly render sprite overlap).
SplitTime.onBoard.sortBodies = function() {
	if(SplitTime.onBoard.bodies.length === 0) SplitTime.onBoard.refetchBodies();
	else
	{
		for(var index = 1; index < SplitTime.onBoard.bodies.length; index++)
		{
			var second = index;
			while(second > 0 && SplitTime.onBoard.bodies[second].y < SplitTime.onBoard.bodies[second - 1].y)
			{
				var tempC = SplitTime.onBoard.bodies[second];
				SplitTime.onBoard.bodies[second] = SplitTime.onBoard.bodies[second - 1];
				SplitTime.onBoard.bodies[second - 1] = tempC;
				second--;
			}
		}
	}
};

SplitTime.onBoard.insertBody = function(element) {
	var index = 0;
	while(index < SplitTime.onBoard.bodies.length && element.y > SplitTime.onBoard.bodies[index].y)
	{
		index++;
	}
	SplitTime.onBoard.bodies.splice(index, 0, element);
};

SplitTime.onBoard.removeBody = function(element) {
	for(var index = 0; index < SplitTime.onBoard.bodies.length; index++)
	{
		if(element == SplitTime.onBoard.bodies[index])
		{
			SplitTime.onBoard.bodies.splice(index, 1);
			index = SplitTime.onBoard.bodies.length;
		}
	}
};
