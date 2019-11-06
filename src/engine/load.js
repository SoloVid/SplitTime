dependsOn("/SLVD/Promise.js");

/**
 * Launch the game
 * @param {int} width pixel width of game
 * @param {int} height pixel height of the game
 * @param {string} [parentId] ID of HTML element within which the game canvas will be placed.
 *                       If unspecified, parent element will be document.body
 * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
 */
SplitTime.launch = function(width, height, parentId, additionalCanvasClass) {
	if(width && height) {
		SplitTime.SCREENX = width;
		SplitTime.SCREENY = height;
	}

    var parent = document.body;
    if(parentId) {
        parent = document.getElementById(parentId);
    }

	SLVD.randomSeed();

	SplitTime.launch.createCanvases(width, height, parent, additionalCanvasClass);
	if(SplitTime.Debug.ENABLED) {
        SplitTime.Debug.attachDebug(parent);
    }

	document.onkeydown = SplitTime.Keyboard.onKeyDown;
	document.onkeyup = SplitTime.Keyboard.onKeyUp;

	var masterData = SplitTime._GAME_DATA;
	var itemsToLoad = masterData.levels.length + masterData.preloadedImageFiles.length;
	var itemsLoaded = 0;
	var promiseCollection = new SLVD.Promise.Collection();

	function incrementAndUpdateLoading() {
		itemsLoaded++;
		updateLoading();
	}

	function updateLoading() {
		//Display load "percentage"
		SplitTime.see.fillStyle = "#000000";
		SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
		SplitTime.see.font="30px Arial";
		SplitTime.see.fillStyle = "#FFFFFF";
		var line = "Loading: " + Math.round((itemsLoaded/itemsToLoad)*100) + "%";
		var x = SplitTime.SCREENX / 2 - SplitTime.see.measureText(line).width / 2;
		SplitTime.see.fillText(line, x, SplitTime.SCREENY / 2);
	}

	updateLoading();

	var i, fileName;
	for(i = 0; i < masterData.preloadedImageFiles.length; i++) {
		fileName = masterData.preloadedImageFiles[i];
		promiseCollection.add(SplitTime.Image.load("preloaded/" + fileName, fileName, true).then(incrementAndUpdateLoading));
	}

	for(i = 0; i < masterData.musicFiles.length; i++) {
		fileName = masterData.musicFiles[i];
		SplitTime.Audio.registerMusic(fileName);
	}
	for(i = 0; i < masterData.soundEffectFiles.length; i++) {
		fileName = masterData.soundEffectFiles[i];
		SplitTime.Audio.registerSoundEffect(fileName);
	}

	for(i = 0; i < masterData.levels.length; i++) {
		var levelData = masterData.levels[i];
		promiseCollection.add(SplitTime.Level.load(levelData).then(incrementAndUpdateLoading));
	}

	//Begin recursion
	promiseCollection.then(function() {
		//Begin main loop
		SplitTime.main();

		//If done SplitTime.loading, launch game-defined launch script
		if(typeof(G.launch === "function")) {
            G.launch();
		} else if(SplitTime.Debug.ENABLED) {
			SplitTime.Logger.warn("G.launch function not defined");
		}
	});
};

SplitTime.launch.createCanvases = function(width, height, parent, additionalCanvasClass) {
	SplitTime.seeB = document.createElement("canvas");
	SplitTime.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
	SplitTime.seeB.setAttribute("id", "game-window");
	SplitTime.seeB.setAttribute("width", width);
	SplitTime.seeB.setAttribute("height", height);
	SplitTime.seeB.setAttribute("style", "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
	if(additionalCanvasClass) {
		SplitTime.seeB.setAttribute("class", additionalCanvasClass);
	}
	parent.appendChild(SplitTime.seeB);
	SplitTime.see = SplitTime.seeB.getContext("2d");

	SplitTime.see.font="20px Arial";
	SplitTime.see.fillText("If this message persists for more than a few seconds,", 10, 30);
	SplitTime.see.fillText("this game will not run on your browser.", 10, 60);

    SplitTime.HUD.createCanvases(width, height);
    SplitTime.BoardRenderer.createCanvases(width, height);
    SplitTime.WeatherRenderer.createCanvases(width, height);
};
