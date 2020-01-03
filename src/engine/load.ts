namespace SplitTime {

	export var seeB: HTMLCanvasElement;
	export var see: CanvasRenderingContext2D;
	
	function createCanvases(width, height, parent, additionalCanvasClass) {
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
	
		SplitTime.hud.createCanvases(width, height);
		SplitTime.BoardRenderer.createCanvases(width, height);
		SplitTime.WeatherRenderer.createCanvases(width, height);
	};
	
	/**
	 * Launch the game
	 * @param {int} width pixel width of game
	 * @param {int} height pixel height of the game
	 * @param {string} [parentId] ID of HTML element within which the game canvas will be placed.
	 *                       If unspecified, parent element will be document.body
	 * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
	 */
	export function launch(width, height, parentId, additionalCanvasClass) {
		if(width && height) {
			SplitTime.SCREENX = width;
			SplitTime.SCREENY = height;
		}
		
		var parent = document.body;
		if(parentId) {
			parent = document.getElementById(parentId);
		}
	
		SLVD.randomSeed();
		
		createCanvases(width, height, parent, additionalCanvasClass);
		if(SplitTime.debug.ENABLED) {
			SplitTime.debug.attachDebug(parent);
		}
		
		document.onkeydown = SplitTime.keyboard.onKeyDown;
		document.onkeyup = SplitTime.keyboard.onKeyUp;
		
		var masterData = SplitTime._GAME_DATA;
		var itemsToLoad = masterData.levels.length + masterData.preloadedImageFiles.length;
		var itemsLoaded = 0;
		var promiseCollection = new SLVD.PromiseCollection();
		
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
			promiseCollection.add(SplitTime.image.load("preloaded/" + fileName, fileName, true).then(incrementAndUpdateLoading));
		}
		
		for(i = 0; i < masterData.musicFiles.length; i++) {
			fileName = masterData.musicFiles[i];
			SplitTime.audio.registerMusic(fileName);
		}
		for(i = 0; i < masterData.soundEffectFiles.length; i++) {
			fileName = masterData.soundEffectFiles[i];
			SplitTime.audio.registerSoundEffect(fileName);
		}
		
		for(i = 0; i < masterData.levels.length; i++) {
			var levelData = masterData.levels[i];
			promiseCollection.add(SplitTime.Level.load(levelData).then(incrementAndUpdateLoading));
		}
		
		//Begin recursion
		promiseCollection.then(function() {
			//Begin main loop
			SplitTime.main.start();
			
			//If done SplitTime.loading, launch game-defined launch script
			if(typeof(launchCallback === "function")) {
				launchCallback();
			} else if(SplitTime.debug.ENABLED) {
				SplitTime.Logger.warn("Game launch callback not set. (You should probably call SplitTIme.onGameEngineLoaded().)");
			}
		});
	};

	var launchCallback = null;
	export function onGameEngineLoaded(callback: () => void) {
		launchCallback = callback;
	}
}