SLVDE.launch = function(callback, width, height, parentId) {
	var parent = document.body;
	if(parentId) {
		parent = document.getElementById(parentId);
	}

	SLVDE.startUp = callback || function() {};
	if(width && height) {
		SLVDE.SCREENX = width;
		SLVDE.SCREENY = height;
	}

	SLVD.randomSeed();

	SLVDE.seeB = document.createElement("canvas");
	SLVDE.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
	SLVDE.seeB.setAttribute("id", "game-window");
	SLVDE.seeB.setAttribute("class", "center");
	SLVDE.seeB.setAttribute("width", SLVDE.SCREENX);
	SLVDE.seeB.setAttribute("height", SLVDE.SCREENY);
	SLVDE.seeB.setAttribute("style", "display: block; margin: auto; border:1px solid #d3d3d3;");
	parent.appendChild(SLVDE.seeB);
	SLVDE.see = SLVDE.seeB.getContext("2d");

	SLVDE.see.font="20px Arial";
	SLVDE.see.fillText("If this message persists for more than a few seconds,", 10, 30);
	SLVDE.see.fillText("this game will not run on your browser.", 10, 60);
	SLVDE.see.font="30px Arial";

	SLVDE.buffer = document.createElement("canvas");
	SLVDE.buffer.setAttribute("width", SLVDE.SCREENX);
	SLVDE.buffer.setAttribute("height", SLVDE.SCREENY);
	SLVDE.bufferCtx = SLVDE.buffer.getContext("2d");

	SLVDE.holderCanvas = document.createElement("canvas");
	SLVDE.holderCanvas.setAttribute("width", SLVDE.SCREENX);
	SLVDE.holderCanvas.setAttribute("height", SLVDE.SCREENY);

	SLVDE.snapShot = document.createElement("canvas");
	SLVDE.snapShot.setAttribute("width", SLVDE.SCREENX);
	SLVDE.snapShot.setAttribute("height", SLVDE.SCREENY);
	SLVDE.snapShotCtx = SLVDE.snapShot.getContext("2d");

	//Initialize
	SLVD.getXML("master.xml").then(function(master) {
		var index, second, filename;
		for(index = 0; index < master.getElementsByTagName("image").length; index++) //Load all images referenced in master.xml outside of levels
		{
			SLVDE.image[index] = new Image();
			SLVDE.image[index].src = "images/preloaded/" + master.getElementsByTagName("image")[index].childNodes[0].nodeValue;
			SLVDE.image[master.getElementsByTagName("image")[index].childNodes[0].nodeValue] = SLVDE.image[index];
		}

		for(index = 0; index < master.getElementsByTagName("music").length; index++) //Load all SLVDE.audio
		{
			filename = master.getElementsByTagName("music")[index].childNodes[0].nodeValue;
			SLVDE.audio[index] = SLVDE.audioCreate("audio/music/" + filename, index);
			SLVDE.audio[index].loop = true;
			SLVDE.audio[filename] = SLVDE.audio[index];
		}
		for(second = index; second < master.getElementsByTagName("soundeffect") + index; second++)
		{
			filename = master.getElementsByTagName("soundeffect")[second - index].childNodes[0].nodeValue;
			SLVDE.audio[second] = SLVDE.audioCreate("audio/soundeffects/" + filname, second);
			SLVDE.audio[second].loop = false;
			SLVDE.audio[filename] = SLVDE.audio[second];
		}

		function loadOneLevel(index) {
			if(index >= master.getElementsByTagName("level").length) {
				return SLVD.promise.as();
			}

			//Create SLVDE.level holder
			SLVDE.level[index] = {};
			//Get file name
			SLVDE.level[index].file = master.getElementsByTagName("level")[index].childNodes[0].nodeValue;
			//Save accessible xml
			return SLVD.getXML("levels/" + SLVDE.level[index].file).then(function(data) {
				var second;

				SLVDE.level[index].filedata = data;
				//Get the name of SLVDE.level
				SLVDE.level[index].name = data.getElementsByTagName("name")[0].childNodes[0].nodeValue;
				//Get the images for SLVDE.level
				SLVDE.level[index].layerImg = [];
				SLVDE.level[index].layerFuncData = [];
				SLVDE.level[index].type = data.getElementsByTagName("type")[0].textContent; //SLVDE.level type
				SLVDE.level[index].width = 0;
				SLVDE.level[index].height = 0;
				for(second = 0; second < data.getElementsByTagName("background").length; second++)
				{
					SLVDE.level[index].layerImg[second] = data.getElementsByTagName("background")[second].textContent;
				}
				//Initialize board programs. These programs are stored in <boardProgram> nodes which are placed into a generated script to declare functions for the SLVDE.level objects.
				SLVDE.level[index].boardProgram = [];
				for(second = 0; second < data.getElementsByTagName("boardProgram").length; second++)
				{
					var content = data.getElementsByTagName("boardProgram")[second].textContent;
					SLVDE.level[index].boardProgram[second] = new Function(content);
				}
				for(second = 0; second < data.getElementsByTagName("NPC").length; second++)
				{
					var current = SLVDE.NPC.length;

					var template = data.getElementsByTagName("NPC")[second].getAttribute("template");
					var NPCCode = data.getElementsByTagName("NPC")[second].textContent;

					SLVDE.NPC[current] = SLVDE.evalObj(template, NPCCode);
					SLVDE.NPC[current].lvl = SLVDE.level[index].name;
				}

				return loadOneLevel(index + 1);
			});
		}

		//Begin recursion
		loadOneLevel(0).then(function(data) {
			//Generate lookup for SLVDE.NPC
			for(var i = 0; i < SLVDE.NPC.length; i++)
			{
				SLVDE.NPC[SLVDE.NPC[i].name] = SLVDE.NPC[i];
			}

			//Begin main loop
			setInterval(SLVDE.main, 1000/SLVDE.FPS);
		});
	});

	SLVDE.loadUpdate = function() { //Used in main interval of engine
		var holder = SLVDE.holderCanvas;
		var index;
		//var SLVDE.loading is the index of both SLVDE.image and SLVDE.level being checked
		if(SLVDE.loading >= SLVDE.image.length && SLVDE.loading >= SLVDE.level.length)
		{
			//If done SLVDE.loading, startup (in the initialize.js file)
			SLVDE.startUp();
			return;
		}
		if((SLVDE.loading < SLVDE.image.length && SLVDE.image[SLVDE.loading].complete) || SLVDE.loading >= SLVDE.image.length) { SLVDE.loadCheck[0] = 1; } //SLVDE.image[SLVDE.loading] corresponds fo SLVDE.loadCheck[0]
		if(SLVDE.loading < SLVDE.level.length)
		{
			for(index = 0; index < SLVDE.level[SLVDE.loading].layerImg.length; index++)
			{
				var layerImg = SLVDE.getImage(SLVDE.level[SLVDE.loading].layerImg[index]);
				//If SLVDE.level's layer's images have loaded, get the functional layer SLVDE.image data and mark load check as done
				if(layerImg.complete /*&& SLVDE.level[SLVDE.loading].layerFunc[index].complete == true*/ && !SLVDE.loadCheck[index + 1])
				{
					if(layerImg.height > SLVDE.level[SLVDE.loading].height)
					{
						SLVDE.level[SLVDE.loading].height = layerImg.height;
					}
					if(layerImg.width > SLVDE.level[SLVDE.loading].width)
					{
						SLVDE.level[SLVDE.loading].width = layerImg.width;
					}

					SLVDE.loadCheck[index + 1] = 1;
				}
			}
		}
		//Display load "percentage"
		SLVDE.see.fillStyle = "#000000";
		SLVDE.see.fillRect(0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
		SLVDE.see.fillStyle = "#FFFFFF";
		SLVDE.see.fillText("Loading: " + Math.round(((SLVDE.loading + 0)/SLVDE.image.length)*100) + "%", 250, 230);

		if(SLVDE.level[SLVDE.loading])
		{
			for(index = 0; index <= SLVDE.level[SLVDE.loading].layerImg.length; index++)
			{
				if(SLVDE.loadCheck[index] != 1)
				{
					index = SLVDE.level[SLVDE.loading].layerImg.length + 2;
				}
			}
			if(index == SLVDE.level[SLVDE.loading].layerImg.length + 1)
			{
				SLVDE.loading++;
				SLVDE.loadCheck.length = 0;
			}
		}
		else if(SLVDE.loadCheck[0] == 1)
		{
			SLVDE.loading++;
			SLVDE.loadCheck.length = 0;
		}
	};
};
