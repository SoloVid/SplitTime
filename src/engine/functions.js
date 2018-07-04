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
	if(victim.onHit === undefined) {
		if(attacker.hp) {
			// var atk = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.atk;
			// var def = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.def;
			var atk = (attacker.hp/attacker.strg)*(attacker.strg/* - attacker.weight*/) + 20;//attacker.atk;
			var def = (victim.hp/victim.strg)*(victim.strg/* - attacker.weight*/) + 20;//attacker.def;
			victim.hp -= atk - ((atk/(Math.PI/2))*Math.atan(Math.pow(def,0.7)/(atk/10)));//(attacker.hp/100)*(attacker.strg/victim.strg)*40;
		}
	}
};

SplitTime.distanceEasy = function(x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

SplitTime.distanceTrue = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
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
	var player = SplitTime.Player.getActiveBody();
	player.setX(x);
	player.setY(y);
	player.z = z;
	SplitTime.Level.setCurrent(board);
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
