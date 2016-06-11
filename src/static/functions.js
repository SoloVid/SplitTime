//Create an SLVDE.audio element
SLVDE.audioCreate = function(source, iden) {
	var aud = document.createElement("audio");
	aud.setAttribute("src", source);
	aud.setAttribute("id", iden);
	return aud;
	//document.write('<SLVDE.audio preload src="' + source + '" id="' + iden + '"></SLVDE.audio>');
	//return document.getElementById(iden);
};

//Pause current SLVDE.audio
SLVDE.audioPause = function() {
	SLVDE.currentAudio.pause();
};

//Play new SLVDE.audio, string audi
SLVDE.audioPlay = function(audi, boolContinue) {
	var audiovar = SLVDE.audio[audi]; //added var
	//Set SLVDE.volume to current SLVDE.volume
	audiovar.volume = SLVDE.volume;
	if(boolContinue != 1)
	{
		audiovar.currentTime = 0;
	}
	audiovar.play();
	SLVDE.currentAudio = audiovar;
};

//Resume current SLVDE.audio
SLVDE.audioResume = function() {
	SLVDE.currentAudio.play();
};

//Black out canvas
SLVDE.canvasBlackout = function(canv) {
	canv.fillStyle="#000000";
	canv.fillRect(0, 0, 640, 480);
};

//Deal damage from, to
SLVDE.damage = function(attacker, victim) {
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

//Determine column in spritesheet to use based on direction
SLVDE.determineColumn = function(direction) {
	var dir = Math.round(direction);//%4;
	if(dir === 0) { return 2; }
	else if(dir == 1) { return 1; }
	else if(dir == 2) { return 3; }
	else if(dir == 3) { return 0; }
	else if(direction < 4 && direction > 3) { return 2; }
	else { return dir; }
};

SLVDE.directionFromString = function(stringDir) {
	switch(stringDir) {
		case "E": return 0;
		case "NE": return 0.5;
		case "N": return 1;
		case "NW": return 1.5;
		case "W": return 2;
		case "SW": return 2.5;
		case "S": return 3;
		case "SE": return 3.5;
		default: console.log("Invalid direction: " + stringDir); return -1;
	}
};
SLVDE.directionToString = function(numDir) {
	switch(numDir) {
		case 0: return "E";
		case 1: return "N";
		case 2: return "W";
		case 3: return "S";
		default:
			if(numDir < 1) return "NE";
			else if(numDir < 2) return "NW";
			else if(numDir < 3) return "SW";
			else return "SE";
	}
};

//Get direction from one point to another (both in Maven orientation)
SLVDE.dirFromTo = function(px, py, ox, oy) {
	//N.B. ENWS = 0123

	if(px == ox)
	{
		if(py < oy) return 3;
		else return 1;
	}

	var baseDir = -Math.atan((py - oy)/(px - ox))/(Math.PI/2);

	if(px > ox) //not in atan range
	{
		baseDir += 2;
	}

	return (baseDir + 4)%4;
};

SLVDE.distanceEasy = function(x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

SLVDE.distanceTrue = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//Change SLVDE.level (Bodys and map) by name of SLVDE.level (in SLVDE.level's xml)
SLVDE.enterLevelByName = function(nam) {
	var index, i, j;

	// console.log(SLVDE.currentPlayer);
	// console.log(SLVDE.player[SLVDE.currentPlayer].name);

	//********Leave current board

	//Finish all paths
	for(i = 0; i < SLVDE.boardBody.length; i++)
	{
		if(SLVDE.boardBody.path.x.length > 0)
		{
			SLVDE.boardBody.setX(SLVDE.boardBody.path.x[SLVDE.boardBody.path.x.length - 1]);
			SLVDE.boardBody.setY(SLVDE.boardBody.path.y[SLVDE.boardBody.path.y.length - 1]);
		}
	}

	SLVDE.boardAgent.length = 0;

	if(SLVDE.currentLevel)
	{
		eval(SLVDE.currentLevel.filedata.getElementsByTagName("exitPrg")[0].textContent);

		//Clear out all functional maps
		SLVDE.currentLevel.layerFuncData.length = 0;
	}

	//********Enter new board

	//Find board
	for(index = 0; index < SLVDE.level.length; index++)
	{
		if(SLVDE.level[index].name == nam)
		{
			SLVDE.currentLevel = SLVDE.level[index];
			index = SLVDE.level.length + 1;
		}
	}
	SLVDE.process = SLVDE.currentLevel.type;
	if(SLVDE.process == "zelda")
	{
		SLVDE.cTeam = SLVDE.player;
		SLVDE.boardAgent.push(SLVDE.player[SLVDE.currentPlayer]);
		SLVDE.insertBoardC(SLVDE.player[SLVDE.currentPlayer]);
	}
	else if(SLVDE.process == "TRPG")
	{
		SLVDE.cTeam = SLVDE.player;
		SLVDE.currentPlayer = -1;
		SLVDE.TRPGNextTurn();
	}

	//Figure out which NPCs are onboard
	for(index = 0; index < SLVDE.NPC.length; index++)
	{
		if(SLVDE.NPC[index].lvl == SLVDE.currentLevel.name)
		{
			SLVDE.boardAgent.push(SLVDE.NPC[index]);
			SLVDE.insertBoardC(SLVDE.NPC[index]);
		}
	}

	function putObjOnBoard(obj) {
		SLVDE.insertBoardC(obj);
		for(i = 0; i < obj.children.length; i++)
		{
			putObjOnBoard(obj.children[i]);
		}
	}

	//Pull board objects from file
	for(index = 0; index < SLVDE.currentLevel.filedata.getElementsByTagName("prop").length; index++)
	{

		var template = SLVDE.currentLevel.filedata.getElementsByTagName("prop")[index].getAttribute("template");
		var objCode = SLVDE.currentLevel.filedata.getElementsByTagName("prop")[index].textContent;

		var iObj = SLVDE.evalObj(template, objCode);

		putObjOnBoard(iObj);
		//SLVDE.insertBoardC(SLVDE.evalObj(template, objCode));
		//prop[current].lvl = SLVDE.currentLevel.name;
	}

	//Initialize functional map
	for(index = 0; index < SLVDE.currentLevel.filedata.getElementsByTagName("layer").length; index++)
	{
		var holder = SLVDE.holderCanvas;
		holder.width = SLVDE.currentLevel.width/(SLVDE.currentLevel.type == "TRPG" ? 32 : 1);
		holder.height = SLVDE.currentLevel.height/(SLVDE.currentLevel.type == "TRPG" ? 32 : 1);
		var holderCtx = holder.getContext("2d");
		holderCtx.clearRect(0, 0, holder.width, holder.height);

		//Draw traces
		var layerTraces = SLVDE.currentLevel.filedata.getElementsByTagName("layer")[index].getElementsByTagName("trace");

		holderCtx.translate(0.5, 0.5);

		for(j = 0; j < layerTraces.length; j++)
		{
			SLVDE.drawVector(layerTraces[j].textContent, holderCtx, layerTraces[j].getAttribute("template"));
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
		for(j = 0; j < SLVDE.boardBody.length; j++)
		{
			var cBody = SLVDE.boardBody[j];
			if(cBody.layer == index)
			{
				for(var k = 0; k < cBody.staticTrace.length; k++)
				{
					SLVDE.drawVector(cBody.staticTrace[k].traceStr, holderCtx, cBody.staticTrace[k].color, cBody);
				}
			}
		}
		holderCtx.translate(-0.5, -0.5);

		//holderCtx.drawImage(SLVDE.currentLevel.layerFunc[index], 0, 0);
		SLVDE.currentLevel.layerFuncData[index] = holderCtx.getImageData(0, 0, SLVDE.currentLevel.width, SLVDE.currentLevel.height);
	}

	eval(SLVDE.currentLevel.filedata.getElementsByTagName("enterPrg")[0].textContent);
};

SLVDE.evalObj = function(template, code) {
	var obj;
	if(template)
	{
		obj = new SLVDE.BodyTemplate[template]();
	}
	else
	{
		obj = new SLVDE.Body(null, null);
	}

	eval(code);

	if(obj.img)
	{
		if(!(obj.img in SLVDE.image))
		{
			SLVDE.image[obj.img] = new Image();
			SLVDE.image[obj.img].src = "images/" + obj.img.replace(/\"/g, "");
		}
		//obj.img = SLVDE.image[obj.img];
	}
	return obj;
};

//Make a valid switch-case resumeFunc out of function. "waitForEngine();" will signal a return from a case.
SLVDE.evalFunc = function(code) {
	var returnCode = "switch(cue) { case 0: {";

	var caseNum = 0;

	returnCode += code.replace(/waitForEngine\(\);/gi, function(n){
		caseNum++;
		return "return " + caseNum + ";}; case " + caseNum + ": {";
	});

	returnCode += "} default: { }; }";

	return returnCode;
};

SLVDE.getNPCByName = function(name) {
	return SLVDE.NPC[name];
};

SLVDE.getPixel = function(x, y, data) {
	var i = SLVDE.pixCoordToIndex(x, y, data);

	var pixArray = [];

	for(var j = 0; j < 4; j++)
	{
		pixArray[j] = data.data[i + j];
	}

	return pixArray;//data.data.slice(i, i + 4);
};

SLVDE.getScriptAlt = function(url, callback) {
	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement("script");
	script.src = url;

	// Handle Script SLVDE.loading
	{
	 var done = false;

	 // Attach handlers for all browsers
	 script.onload = script.onreadystatechange = function(){
		if ( !done && (!this.readyState ||
			  this.readyState == "loaded" || this.readyState == "complete") ) {
		   done = true;
		   if (callback)
			  callback();

		   // Handle memory leak in IE
		   script.onload = script.onreadystatechange = null;
		}
	 };
	}
	head.appendChild(script);

	// We handle everything using the script element injection
	return undefined;
};

//Gets the index on canvas data of given coordinates
SLVDE.pixCoordToIndex = function(x,y,dat) {
 return (y*dat.width + x)*4;
};

//Like SLVDE.enterLevelByName() with coordinates
SLVDE.send = function(board, x, y, z) {
	SLVDE.player[SLVDE.currentPlayer].setX(x);
	SLVDE.player[SLVDE.currentPlayer].setY(y);
	SLVDE.player[SLVDE.currentPlayer].layer = z;
	SLVDE.enterLevelByName(board);
};

//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
SLVDE.xPixToTile = function(x) {
	return Math.round((x-7)/32);
};
SLVDE.xTileToPix = function(x) {
	return (x*32)+7;
};
SLVDE.yPixToTile = function(y) {
	return Math.round((y-21)/32);
};
SLVDE.yTileToPix = function(y) {
	return (y*32)+21;
};
