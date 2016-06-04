//Load from localStorage save "file" of fileName, returns SLVDE.level name to be passed to SLVDE.enterLevelByName()
SLVDE.fileLoad = function(fileName) {
	var keyList = { level: "", x: "", y: "", layer: "", mvmt: "", speech: "", dmnr: "", dir: "", steps: "", pushy: "", hp: "", maxHp: "", strg: "", spd: "" };
	var index, key, item;
	for(index = 0; index < SLVDE.NPC.length; index++)
	{
		for(key in keyList)
		{
			item = localStorage.getItem(GAMEID + "_" + fileName + "_NPC" + index + "_" + key);
			if(item)
			{
				if(key != "SLVDE.level" && key != "speech") SLVDE.NPC[index][key] = Number(item);
				else SLVDE.NPC[index][key] = item;
			}
			else { console.log(item + "=null"); }
		}
	}
	for(index = 0; index < SLVDE.player.length; index++)
	{
		for(key in keyList)
		{
			item = localStorage.getItem(GAMEID + "_" + fileName + "_player" + index + "_" + key);
			if(item)
			{
				if(key != "SLVDE.level" && key != "speech") SLVDE.player[index][key] = Number(item);
				else SLVDE.player[index][key] = item;
			}
			else { console.log(index + key + "=null"); }
		}
	}

	//localStorage.getItem(GAMEID + "_" + fileName + "_SLVDE.currentLevelName");
	SLVDE.currentPlayer = eval(localStorage.getItem(GAMEID + "_" + fileName + "_currentPlayer"));
	item = localStorage.getItem(GAMEID + "_" + fileName + "_SAVE");
	SLVDE.SAVE = JSON.parse(item);

	//Return SLVDE.level name
	return localStorage.getItem(GAMEID + "_" + fileName + "_SLVDE.currentLevelName");
};

//Save current game to localStorage "file" of fileName
SLVDE.fileSave = function(fileName) {
	console.log("starting save...");
	var keyList = { level: "", x: "", y: "", layer: "", mvmt: "", speech: "", dmnr: "", dir: "", steps: "", pushy: "", hp: "", maxHp: "", strg: "", spd: "" };
	console.log("listed keys");
	var index, key;
	for(index in SLVDE.NPC)
	{
		//console.log("saving SLVDE.NPC" + index);
		for(key in keyList)
		{
			//console.log("saving" + key);
			try {
			localStorage.setItem(GAMEID + "_" + fileName + "_NPC" + index + "_" + key, SLVDE.NPC[index][key]); }
			catch(e) { console.log("failed on SLVDE.NPC " + index + " " + key); }
		}
	}
	console.log("between loops");
	for(index in SLVDE.player)
	{
		for(key in keyList)
		{
			try {
			localStorage.setItem(GAMEID + "_" + fileName + "_player" + index + "_" + key, SLVDE.player[index][key]); }
			catch(e) { console.log("failed on SLVDE.player " + index + " " + key); }
		}
	}
	console.log("through loops");

	localStorage.setItem(GAMEID + "_" + fileName + "_SLVDE.currentLevelName", SLVDE.currentLevel.name);
	console.log("saved SLVDE.level name as " + SLVDE.currentLevel.name);
	localStorage.setItem(GAMEID + "_" + fileName + "_currentPlayer", SLVDE.currentPlayer);
	localStorage.setItem(GAMEID + "_" + fileName + "_SAVE", JSON.stringify(SLVDE.SAVE));
	console.log("done");
};
