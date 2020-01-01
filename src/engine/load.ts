namespace SplitTime {

	export var seeB: HTMLCanvasElement;
	export var see: CanvasRenderingContext2D;
	
	function createCanvases(width, height, parentId) {
		var parent = document.body;
		if(parentId) {
			parent = document.getElementById(parentId);
		}
		
		SplitTime.seeB = document.createElement("canvas");
		SplitTime.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
		SplitTime.seeB.setAttribute("id", "game-window");
		SplitTime.seeB.setAttribute("class", "center");
		SplitTime.seeB.setAttribute("width", "" + SplitTime.SCREENX);
		SplitTime.seeB.setAttribute("height", "" + SplitTime.SCREENY);
		SplitTime.seeB.setAttribute("style", "display: block; margin: auto; border:1px solid #d3d3d3;");
		parent.appendChild(SplitTime.seeB);
		SplitTime.see = SplitTime.seeB.getContext("2d");
		
		SplitTime.see.font="20px Arial";
		SplitTime.see.fillText("If this message persists for more than a few seconds,", 10, 30);
		SplitTime.see.fillText("this game will not run on your browser.", 10, 60);
		
		SplitTime.hud.createCanvases(width, height);
		SplitTime.BoardRenderer.createCanvases(width, height);
		SplitTime.WeatherRenderer.createCanvases(width, height);
	};
	
	export function launch(callback, width, height, parentId) {
		var startUpCallback = callback || function() {};
		if(width && height) {
			SplitTime.SCREENX = width;
			SplitTime.SCREENY = height;
		}
		
		SLVD.randomSeed();
		
		createCanvases(width, height, parentId);
		SplitTime.debug.attachDebug(parentId);
		
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
			SplitTime.see.fillText("Loading: " + Math.round((itemsLoaded/itemsToLoad)*100) + "%", 250, 230);
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
			SplitTime.mainFunc();
			
			//If done SplitTime.loading, startup (in the initialize.js file)
			startUpCallback();
		});
	};
}