SplitTime.launch = function(callback, width, height, parentId) {
	var parent = document.body;
	if(parentId) {
		parent = document.getElementById(parentId);
	}

	SplitTime.startUp = callback || function() {};
	if(width && height) {
		SplitTime.SCREENX = width;
		SplitTime.SCREENY = height;
	}

	SLVD.randomSeed();

	SplitTime.seeB = document.createElement("canvas");
	SplitTime.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
	SplitTime.seeB.setAttribute("id", "game-window");
	SplitTime.seeB.setAttribute("class", "center");
	SplitTime.seeB.setAttribute("width", SplitTime.SCREENX);
	SplitTime.seeB.setAttribute("height", SplitTime.SCREENY);
	SplitTime.seeB.setAttribute("style", "display: block; margin: auto; border:1px solid #d3d3d3;");
	parent.appendChild(SplitTime.seeB);
	SplitTime.see = SplitTime.seeB.getContext("2d");

	SplitTime.see.font="20px Arial";
	SplitTime.see.fillText("If this message persists for more than a few seconds,", 10, 30);
	SplitTime.see.fillText("this game will not run on your browser.", 10, 60);

	SplitTime.buffer = document.createElement("canvas");
	SplitTime.buffer.setAttribute("width", SplitTime.SCREENX);
	SplitTime.buffer.setAttribute("height", SplitTime.SCREENY);
	SplitTime.bufferCtx = SplitTime.buffer.getContext("2d");

	SplitTime.holderCanvas = document.createElement("canvas");
	SplitTime.holderCanvas.setAttribute("width", SplitTime.SCREENX);
	SplitTime.holderCanvas.setAttribute("height", SplitTime.SCREENY);

	SplitTime.snapShot = document.createElement("canvas");
	SplitTime.snapShot.setAttribute("width", SplitTime.SCREENX);
	SplitTime.snapShot.setAttribute("height", SplitTime.SCREENY);
	SplitTime.snapShotCtx = SplitTime.snapShot.getContext("2d");

	//Sets variables useful for determining what keys are down at any time.
	document.onkeydown = function(e) {
		//Prevent scrolling with arrows
	    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }

		var key = SplitTime.keyCodeKey[e.which || e.keyCode];//e.key.toLowerCase();

		if(key == " ")
		{
			key = "space";
		}
		//alert(key);

		if(key == "t")
		{
			alert("saving...");
			//alert("test second alert");
			SplitTime.fileSave("testFile");
			alert("saved!");
		}
		else if(key == "y")
		{
		/*	var seen = [];

			var alerter = JSON.stringify(SplitTime.player[SplitTime.currentPlayer], function(key, val) {
				if(val != null && typeof val == "object") {
					if(seen.indexOf(val) >= 0) return seen.push(val); }
					return val; });
			alert(alerter);*/
			alert(SplitTime.player[SplitTime.currentPlayer].x + ", " + SplitTime.player[SplitTime.currentPlayer].y + ", " + SplitTime.player[SplitTime.currentPlayer].layer);
		}

		if(SplitTime.keyDown[key] === undefined)
		{
			SplitTime.keyFirstDown = key;
		}
		SplitTime.keyDown[key] = true;

		if(SplitTime.process == "wait" && SplitTime.mainPromise)
		{
			if(SplitTime.currentLevel)
			{
				SplitTime.process = SplitTime.currentLevel.type;
			}
			SplitTime.mainPromise.resolve(key);
		}
		else if(SplitTime.process == "waitForEnterOrSpace" && (SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space"))
		{
			delete SplitTime.keyFirstDown;

			if(SplitTime.currentLevel)
			{
				SplitTime.process = SplitTime.currentLevel.type;
			}
			SplitTime.mainPromise.resolve(key);
		}
	};

	//The clean-up of the above function.
	document.onkeyup = function(e) {
		var key = SplitTime.keyCodeKey[e.keyCode];//e.key.toLowerCase();

		if(key == SplitTime.keyFirstDown)
		{
			delete SplitTime.keyFirstDown;
		}

		delete SplitTime.keyDown[key];
	};

	//Initialize
	SLVD.getXML("master.xml").then(function(master) {
		var index, second, filename;
		for(index = 0; index < master.getElementsByTagName("image").length; index++) //Load all images referenced in master.xml outside of levels
		{
			SplitTime.image[index] = new Image();
			SplitTime.image[index].src = "images/preloaded/" + master.getElementsByTagName("image")[index].childNodes[0].nodeValue;
			SplitTime.image[master.getElementsByTagName("image")[index].childNodes[0].nodeValue] = SplitTime.image[index];
		}

		for(index = 0; index < master.getElementsByTagName("music").length; index++) //Load all SplitTime.audio
		{
			filename = master.getElementsByTagName("music")[index].childNodes[0].nodeValue;
			SplitTime.audio[index] = SplitTime.audioCreate("audio/music/" + filename, index);
			SplitTime.audio[index].loop = true;
			SplitTime.audio[filename] = SplitTime.audio[index];
		}
		for(second = index; second < master.getElementsByTagName("soundeffect") + index; second++)
		{
			filename = master.getElementsByTagName("soundeffect")[second - index].childNodes[0].nodeValue;
			SplitTime.audio[second] = SplitTime.audioCreate("audio/soundeffects/" + filname, second);
			SplitTime.audio[second].loop = false;
			SplitTime.audio[filename] = SplitTime.audio[second];
		}

		function loadOneLevel(index) {
			if(index >= master.getElementsByTagName("level").length) {
				return SLVD.promise.as();
			}

			//Create SplitTime.level holder
			SplitTime.level[index] = {};
			//Get file name
			SplitTime.level[index].file = master.getElementsByTagName("level")[index].childNodes[0].nodeValue;
			//Save accessible xml
			return SLVD.getXML("levels/" + SplitTime.level[index].file).then(function(data) {
				var second;

				SplitTime.level[index].filedata = data;
				//Get the name of SplitTime.level
				SplitTime.level[index].name = data.getElementsByTagName("name")[0].childNodes[0].nodeValue;
				//Get the images for SplitTime.level
				SplitTime.level[index].layerImg = [];
				SplitTime.level[index].layerFuncData = [];
				SplitTime.level[index].type = data.getElementsByTagName("type")[0].textContent; //SplitTime.level type
				SplitTime.level[index].width = 0;
				SplitTime.level[index].height = 0;
				for(second = 0; second < data.getElementsByTagName("background").length; second++)
				{
					SplitTime.level[index].layerImg[second] = data.getElementsByTagName("background")[second].textContent;
				}
				//Initialize board programs. These programs are stored in <boardProgram> nodes which are placed into a generated script to declare functions for the SplitTime.level objects.
				SplitTime.level[index].boardProgram = [];
				for(second = 0; second < data.getElementsByTagName("boardProgram").length; second++)
				{
					var content = data.getElementsByTagName("boardProgram")[second].textContent;
					SplitTime.level[index].boardProgram[second] = new Function(content);
				}
				for(second = 0; second < data.getElementsByTagName("NPC").length; second++)
				{
					var current = SplitTime.NPC.length;

					var template = data.getElementsByTagName("NPC")[second].getAttribute("template");
					var NPCCode = data.getElementsByTagName("NPC")[second].textContent;

					SplitTime.NPC[current] = SplitTime.evalObj(template, NPCCode);
					SplitTime.NPC[current].lvl = SplitTime.level[index].name;
				}

				return loadOneLevel(index + 1);
			});
		}

		//Begin recursion
		loadOneLevel(0).then(function(data) {
			//Generate lookup for SplitTime.NPC
			for(var i = 0; i < SplitTime.NPC.length; i++)
			{
				SplitTime.NPC[SplitTime.NPC[i].name] = SplitTime.NPC[i];
			}

			//Begin main loop
			SplitTime.main();
		});
	});

	SplitTime.loadUpdate = function() { //Used in main interval of engine
		var holder = SplitTime.holderCanvas;
		var index;
		//var SplitTime.loading is the index of both SplitTime.image and SplitTime.level being checked
		if(SplitTime.loading >= SplitTime.image.length && SplitTime.loading >= SplitTime.level.length)
		{
			//If done SplitTime.loading, startup (in the initialize.js file)
			SplitTime.startUp();

			SplitTime.msPerFrame = (1/SplitTime.FPS)*1000;

			return;
		}
		if((SplitTime.loading < SplitTime.image.length && SplitTime.image[SplitTime.loading].complete) || SplitTime.loading >= SplitTime.image.length) { SplitTime.loadCheck[0] = 1; } //SplitTime.image[SplitTime.loading] corresponds fo SplitTime.loadCheck[0]
		if(SplitTime.loading < SplitTime.level.length)
		{
			for(index = 0; index < SplitTime.level[SplitTime.loading].layerImg.length; index++)
			{
				var layerImg = SplitTime.getImage(SplitTime.level[SplitTime.loading].layerImg[index]);
				//If SplitTime.level's layer's images have loaded, get the functional layer SplitTime.image data and mark load check as done
				if(layerImg.complete /*&& SplitTime.level[SplitTime.loading].layerFunc[index].complete == true*/ && !SplitTime.loadCheck[index + 1])
				{
					if(layerImg.height > SplitTime.level[SplitTime.loading].height)
					{
						SplitTime.level[SplitTime.loading].height = layerImg.height;
					}
					if(layerImg.width > SplitTime.level[SplitTime.loading].width)
					{
						SplitTime.level[SplitTime.loading].width = layerImg.width;
					}

					SplitTime.loadCheck[index + 1] = 1;
				}
			}
		}
		//Display load "percentage"
		SplitTime.see.fillStyle = "#000000";
		SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
		SplitTime.see.font="30px Arial";
		SplitTime.see.fillStyle = "#FFFFFF";
		SplitTime.see.fillText("Loading: " + Math.round(((SplitTime.loading + 0)/SplitTime.image.length)*100) + "%", 250, 230);

		if(SplitTime.level[SplitTime.loading])
		{
			for(index = 0; index <= SplitTime.level[SplitTime.loading].layerImg.length; index++)
			{
				if(SplitTime.loadCheck[index] != 1)
				{
					index = SplitTime.level[SplitTime.loading].layerImg.length + 2;
				}
			}
			if(index == SplitTime.level[SplitTime.loading].layerImg.length + 1)
			{
				SplitTime.loading++;
				SplitTime.loadCheck.length = 0;
			}
		}
		else if(SplitTime.loadCheck[0] == 1)
		{
			SplitTime.loading++;
			SplitTime.loadCheck.length = 0;
		}
	};
};
