//Load from localStorage save "file" of fileName, returns SplitTime.level name to be passed to SplitTime.enterLevelById()
SplitTime.fileLoad = function(fileName) {
	var keyList = { level: "", x: "", y: "", layer: "", mvmt: "", speech: "", dmnr: "", dir: "", steps: "", pushy: "", hp: "", maxHp: "", strg: "", spd: "" };
	var index, key, item;
	for(index = 0; index < SplitTime.NPC.length; index++)
	{
		for(key in keyList)
		{
			item = localStorage.getItem(GAMEID + "_" + fileName + "_NPC" + index + "_" + key);
			if(item)
			{
				if(key != "SplitTime.level" && key != "speech") SplitTime.NPC[index][key] = Number(item);
				else SplitTime.NPC[index][key] = item;
			}
			else { console.log(item + "=null"); }
		}
	}
	for(index = 0; index < SplitTime.player.length; index++)
	{
		for(key in keyList)
		{
			item = localStorage.getItem(GAMEID + "_" + fileName + "_player" + index + "_" + key);
			if(item)
			{
				if(key != "SplitTime.level" && key != "speech") SplitTime.player[index][key] = Number(item);
				else SplitTime.player[index][key] = item;
			}
			else { console.log(index + key + "=null"); }
		}
	}

	//localStorage.getItem(GAMEID + "_" + fileName + "_SplitTime.currentLevelName");
	SplitTime.currentPlayer = eval(localStorage.getItem(GAMEID + "_" + fileName + "_currentPlayer"));
	item = localStorage.getItem(GAMEID + "_" + fileName + "_SAVE");
	SplitTime.SAVE = JSON.parse(item);

	//Return SplitTime.level name
	return localStorage.getItem(GAMEID + "_" + fileName + "_SplitTime.currentLevelName");
};

//Save current game to localStorage "file" of fileName
SplitTime.fileSave = function(fileName) {
	console.log("starting save...");
	var keyList = { level: "", x: "", y: "", layer: "", mvmt: "", speech: "", dmnr: "", dir: "", steps: "", pushy: "", hp: "", maxHp: "", strg: "", spd: "" };
	console.log("listed keys");
	var index, key;
	for(index in SplitTime.NPC)
	{
		//console.log("saving SplitTime.NPC" + index);
		for(key in keyList)
		{
			//console.log("saving" + key);
			try {
			localStorage.setItem(GAMEID + "_" + fileName + "_NPC" + index + "_" + key, SplitTime.NPC[index][key]); }
			catch(e) { console.log("failed on SplitTime.NPC " + index + " " + key); }
		}
	}
	console.log("between loops");
	for(index in SplitTime.player)
	{
		for(key in keyList)
		{
			try {
			localStorage.setItem(GAMEID + "_" + fileName + "_player" + index + "_" + key, SplitTime.player[index][key]); }
			catch(e) { console.log("failed on SplitTime.player " + index + " " + key); }
		}
	}
	console.log("through loops");

	localStorage.setItem(GAMEID + "_" + fileName + "_SplitTime.currentLevelName", SplitTime.currentLevel.name);
	console.log("saved SplitTime.level name as " + SplitTime.currentLevel.name);
	localStorage.setItem(GAMEID + "_" + fileName + "_currentPlayer", SplitTime.currentPlayer);
	localStorage.setItem(GAMEID + "_" + fileName + "_SAVE", JSON.stringify(SplitTime.SAVE));
	console.log("done");
};
