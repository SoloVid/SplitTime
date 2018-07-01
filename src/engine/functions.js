//Create an SplitTime.audio element
SplitTime.audioCreate = function(source, iden) {
	var aud = document.createElement("audio");
	aud.setAttribute("src", source);
	aud.setAttribute("id", iden);
	return aud;
	//document.write('<SplitTime.audio preload src="' + source + '" id="' + iden + '"></SplitTime.audio>');
	//return document.getElementById(iden);
};

//Pause current SplitTime.audio
SplitTime.audioPause = function() {
	SplitTime.currentAudio.pause();
};

//Play new SplitTime.audio, string audi
SplitTime.audioPlay = function(audi, boolContinue) {
	var audiovar = SplitTime.audio[audi]; //added var
	//Set SplitTime.volume to current SplitTime.volume
	audiovar.volume = SplitTime.volume;
	if(boolContinue != 1)
	{
		audiovar.currentTime = 0;
	}
	audiovar.play();
	SplitTime.currentAudio = audiovar;
};

//Resume current SplitTime.audio
SplitTime.audioResume = function() {
	SplitTime.currentAudio.play();
};

//Black out canvas
SplitTime.canvasBlackout = function(canv) {
	canv.fillStyle="#000000";
	canv.fillRect(0, 0, 640, 480);
};

//Deal damage from, to
SplitTime.damage = function(attacker, victim) {
	if(victim.onHit === undefined)
	{
		if(attacker.hp)
		{
			// var atk = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.atk;
			// var def = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.def;
			var atk = (attacker.hp/attacker.strg)*(attacker.strg/* - attacker.weight*/) + 20;//attacker.atk;
			var def = (victim.hp/victim.strg)*(victim.strg/* - attacker.weight*/) + 20;//attacker.def;
			victim.hp -= atk - ((atk/(Math.PI/2))*Math.atan(Math.pow(def,0.7)/(atk/10)));//(attacker.hp/100)*(attacker.strg/victim.strg)*40;
		}
	}
	else// if(victim.hp != null)
	{
		resumeFunc = victim.onHit;
		resumeCue = victim.onHit(0, attacker);
	}
	//Make victim aggressive if excitable
	if(victim.dmnr == 1) victim.dmnr = 2;
};

SplitTime.distanceEasy = function(x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

SplitTime.distanceTrue = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//Change SplitTime.level (Bodys and map) by name of SplitTime.level (in SplitTime.level's xml)
SplitTime.enterLevelById = function(id) {
	var index, i, j;

	// console.log(SplitTime.currentPlayer);
	// console.log(SplitTime.player[SplitTime.currentPlayer].name);

	//********Leave current board

	//Finish all paths
	for(i = 0; i < SplitTime.onBoard.bodies.length; i++) {
		if(SplitTime.onBoard.bodies.path.x.length > 0) {
			SplitTime.onBoard.bodies.setX(SplitTime.onBoard.bodies.path.x[SplitTime.onBoard.bodies.path.x.length - 1]);
			SplitTime.onBoard.bodies.setY(SplitTime.onBoard.bodies.path.y[SplitTime.onBoard.bodies.path.y.length - 1]);
		}
	}

	if(SplitTime.currentLevel) {
		var exitFunctionId = SplitTime.currentLevel.filedata.getElementsByTagName("exitFunction")[0].textContent;
		SplitTime.currentLevel.runFunction(exitFunctionId);

		//Clear out all functional maps
		SplitTime.currentLevel.layerFuncData.length = 0;
	}

	//********Enter new board

	SplitTime.currentLevel = SplitTime.Level.get(id);

	SplitTime.process = "loading";
	SplitTime.currentLevel.load.then(function() {
		SplitTime.process = SplitTime.currentLevel.type;
		if(SplitTime.process == "action")
		{
			SplitTime.cTeam = SplitTime.player;
		}
		else if(SplitTime.process == "overworld")
		{
			SplitTime.cTeam = SplitTime.player;
			SplitTime.currentPlayer = -1;
			SplitTime.TRPGNextTurn();
		}

		SplitTime.onBoard.refetchBodies();

		//Initialize functional map
		for(index = 0; index < SplitTime.currentLevel.filedata.getElementsByTagName("layer").length; index++)
		{
			var holder = SplitTime.holderCanvas;
			holder.width = SplitTime.currentLevel.width/(SplitTime.currentLevel.type == "overworld" ? 32 : 1);
			holder.height = SplitTime.currentLevel.height/(SplitTime.currentLevel.type == "overworld" ? 32 : 1);
			var holderCtx = holder.getContext("2d");
			holderCtx.clearRect(0, 0, holder.width, holder.height);

			//Draw traces
			var layerTraces = SplitTime.currentLevel.filedata.getElementsByTagName("layer")[index].getElementsByTagName("trace");

			holderCtx.translate(0.5, 0.5);

			for(j = 0; j < layerTraces.length; j++)
			{
				SplitTime.Trace.draw(layerTraces[j].textContent, holderCtx, layerTraces[j].getAttribute("type"));
				// holderCtx.strokeStyle = layerTraces[j].getAttribute("template");//.getElementsByTagName("color")[0].textContent;
				// holderCtx.fillStyle = holderCtx.strokeStyle;
				//
				// var regex = /\([^\)]+\)/g;
				// var xRegex = /\(([\d]*),/;
				// var yRegex = /,[\s]*([\d]*)\)/;
				// var newX, newY;
				//
				// var pointStr = layerTraces[j].textContent;//.getElementsByTagName("path")[0].textContent;
				// var points = pointStr.match(regex);
				// console.log(points.length + "|" + points + "|");
				//
				// holderCtx.beginPath();
				//
				// newX = points[0].match(xRegex)[1];
				// newY = points[0].match(yRegex)[1];
				//
				// holderCtx.moveTo(newX, newY);
				//
				// holderCtx.fillRect(newX - .5, newY - .5, 1, 1);
				//
				// for(var k = 1; k < points.length; k++)
				// {
				// 	if(points[k] == "(close)")
				// 	{
				// 		holderCtx.closePath();
				// 		holderCtx.stroke();
				// 		holderCtx.fill();
				// 	}
				// 	else
				// 	{
				// 		newX = points[k].match(xRegex)[1];
				// 		newY = points[k].match(yRegex)[1];
				//
				// 		holderCtx.lineTo(newX, newY);
				// 		holderCtx.stroke();
				// 		holderCtx.fillRect(newX - .5, newY - .5, 1, 1);
				// 	}
				// }
			}
			for(j = 0; j < SplitTime.onBoard.bodies.length; j++)
			{
				var cBody = SplitTime.onBoard.bodies[j];
				if(cBody.z == index)
				{
					for(var k = 0; k < cBody.staticTrace.length; k++)
					{
						SplitTime.Trace.draw(cBody.staticTrace[k].traceStr, holderCtx, cBody.staticTrace[k].type, cBody);
					}
				}
			}
			holderCtx.translate(-0.5, -0.5);

			//holderCtx.drawImage(SplitTime.currentLevel.layerFunc[index], 0, 0);

			SplitTime.currentLevel.layerFuncData[index] = holderCtx.getImageData(0, 0, SplitTime.currentLevel.width, SplitTime.currentLevel.height);
		}

		var enterFunctionId = SplitTime.currentLevel.filedata.getElementsByTagName("enterFunction")[0].textContent;
		SplitTime.currentLevel.runFunction(enterFunctionId);
	});
};

SplitTime.getNPCByName = function(name) {
	return SplitTime.NPC[name];
};

SplitTime.getPixel = function(x, y, data) {
	var i = SplitTime.pixCoordToIndex(x, y, data);

	var pixArray = [];

	for(var j = 0; j < 4; j++)
	{
		pixArray[j] = data.data[i + j];
	}

	return pixArray;//data.data.slice(i, i + 4);
};

//Gets the index on canvas data of given coordinates
SplitTime.pixCoordToIndex = function(x,y,dat) {
 return (y*dat.width + x)*4;
};

//Like SplitTime.enterLevelById() with coordinates
SplitTime.send = function(board, x, y, z) {
	SplitTime.player[SplitTime.currentPlayer].setX(x);
	SplitTime.player[SplitTime.currentPlayer].setY(y);
	SplitTime.player[SplitTime.currentPlayer].z = z;
	SplitTime.enterLevelById(board);
};

//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
SplitTime.xPixToTile = function(x) {
	return Math.round((x-7)/32);
};
SplitTime.xTileToPix = function(x) {
	return (x*32)+7;
};
SplitTime.yPixToTile = function(y) {
	return Math.round((y-21)/32);
};
SplitTime.yTileToPix = function(y) {
	return (y*32)+21;
};
