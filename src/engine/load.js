dependsOn("/SLVD/Promise.js");

SplitTime.launch = function(callback, width, height, parentId) {
	var startUpCallback = callback || function() {};
	if(width && height) {
		SplitTime.SCREENX = width;
		SplitTime.SCREENY = height;
	}

	SLVD.randomSeed();

	SplitTime.launch.createCanvases(width, height, parentId);
    SplitTime.Debug.attachDebug(parentId);

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
		SplitTime.see.fillText("Loading: " + Math.round((itemsLoaded/itemsToLoad)*100) + "%", 250, 230);
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

		//If done SplitTime.loading, startup (in the initialize.js file)
		startUpCallback();
	});
};

SplitTime.launch.createCanvases = function(width, height, parentId) {
	var parent = document.body;
	if(parentId) {
		parent = document.getElementById(parentId);
	}

	SplitTime.seeB = document.createElement("canvas");
	SplitTime.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
	SplitTime.seeB.setAttribute("id", "game-window");
	SplitTime.seeB.setAttribute("width", width);
	SplitTime.seeB.setAttribute("height", height);
	SplitTime.seeB.setAttribute("style", "display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
	parent.appendChild(SplitTime.seeB);
	SplitTime.see = SplitTime.seeB.getContext("2d");

	SplitTime.see.font="20px Arial";
	SplitTime.see.fillText("If this message persists for more than a few seconds,", 10, 30);
	SplitTime.see.fillText("this game will not run on your browser.", 10, 60);

    SplitTime.HUD.createCanvases(width, height);
    SplitTime.BoardRenderer.createCanvases(width, height);
    SplitTime.WeatherRenderer.createCanvases(width, height);
};
