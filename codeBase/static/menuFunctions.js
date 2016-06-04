SLVDE.showImage = function(file, duration, waitForEnterSpace) {
	//SLVDE.process = "wait";
	SLVDE.see.drawImage(file, 0, 0, SLVDE.SCREENX, SLVDE.SCREENY);
	return SLVDE.delay(duration).then(function() {
		if(waitForEnterSpace)
		{
			return SLVDE.waitForEnterOrSpace();
		}
		else
		{
			//var oneTimePromise = new SLVD.promise();
			//oneTimePromise.resolve();
			//return oneTimePromise;
			return SLVD.promise.as();
		}
	});
};

SLVDE.menu = function() {
	this.point = [];
};

SLVDE.menu.prototype.cursor = undefined;
SLVDE.menu.prototype.point = [];

SLVDE.menu.prototype.addPoint = function(x, y) {
	var index = this.point.length;
	this.point[index] = { x: x, y: y };
};

SLVDE.menu.prototype.runMenu = function() {
	this.currentPoint = 0;
	delete this.chosenPoint;
	SLVDE.process = "menu";
	SLVDE.currentMenu = this;
	return SLVDE.setupMainPromise();
};

SLVDE.menu.prototype.killPoints = function() {
	this.point.length = 0;
	delete this.update;
};

SLVDE.menu.prototype.update = function() {}; //Customizable function; run every frame

SLVDE.menu.prototype.handleMenu = function() {
	/*This menu system navigates on a grid even though points are listed linearly.
	/*Basically, the code finds the closest point (in the direction of the key press
	to the current point that is within a 90 degree viewing angle from the point in that direction.*/
	//Draw menu background
//	SLVDE.see.drawImage(this.background, 0, 0);
	//Draw cursor
//	SLVDE.see.drawImage(this.cursor, this.point[this.currentPoint].x, this.point[this.currentPoint].y);
	var prevPoint = this.currentPoint;
	var iPoint = prevPoint;
	var bestPoint = iPoint;
	var bestdx = 1000; //Distance from prevPoint to bestPoint
	var bestdy = 1000;
	var isUnderUpperBound, isAboveLowerBound;
	var testdx, testdy, setNewBest;
	if(SLVDE.keyFirstDown == "a" || SLVDE.keyFirstDown == "left") //Left
	{
		do //While index point does not equal original point
		{
			var isLeft = this.point[iPoint].x < this.point[prevPoint].x;
			if(isLeft)
			{
				isUnderUpperBound = this.point[iPoint].y <= -this.point[iPoint].x + this.point[prevPoint].x + this.point[prevPoint].y;
				isAboveLowerBound = this.point[iPoint].y >= this.point[iPoint].x - this.point[prevPoint].x + this.point[prevPoint].y;
			}
			else
			{
				isUnderUpperBound = this.point[iPoint].y <= -this.point[iPoint].x + (this.point[prevPoint].x + SLVDE.SCREENX) + this.point[prevPoint].y;
				isAboveLowerBound = this.point[iPoint].y >= this.point[iPoint].x - (this.point[prevPoint].x + SLVDE.SCREENX) + this.point[prevPoint].y;
			}
			if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
			{
				testdx = this.point[prevPoint].x - this.point[iPoint].x;
				if(!isLeft) testdx += SLVDE.SCREENX;
				testdy = Math.abs(this.point[prevPoint].y - this.point[iPoint].y);
				if(testdx <= bestdx)
				{
					setNewBest = true;
					if(testdx == bestdx && testdy > bestdy) setNewBest = false;
					if(setNewBest)
					{
						bestdx = testdx;
						bestdy = testdy;
						bestPoint = iPoint;
					}
				}
			}
			iPoint = (this.point.length + iPoint - 1)%this.point.length;
		} while(iPoint != prevPoint);
		this.currentPoint = bestPoint;
	}
	else if(SLVDE.keyFirstDown == "w" || SLVDE.keyFirstDown == "up") //Up
	{
		do //While index point does not equal original point
		{
			var isUp = this.point[iPoint].y < this.point[prevPoint].y;
			if(isUp)
			{
				isAboveLowerBound = this.point[iPoint].x <= -this.point[iPoint].y + this.point[prevPoint].y + this.point[prevPoint].x;
				isUnderUpperBound = this.point[iPoint].x >= this.point[iPoint].y - this.point[prevPoint].y + this.point[prevPoint].x;
			}
			else
			{
				isAboveLowerBound = this.point[iPoint].x <= -this.point[iPoint].y + (this.point[prevPoint].y + SLVDE.SCREENY) + this.point[prevPoint].x;
				isUnderUpperBound = this.point[iPoint].x >= this.point[iPoint].y - (this.point[prevPoint].y + SLVDE.SCREENY) + this.point[prevPoint].x;
			}
			if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
			{
				testdy = this.point[prevPoint].y - this.point[iPoint].y;
				if(!isUp) testdy += SLVDE.SCREENY;
				testdx = Math.abs(this.point[prevPoint].x - this.point[iPoint].x);
				if(testdy <= bestdy)
				{
					setNewBest = true;
					if(testdy == bestdy && testdx > bestdx) setNewBest = false;
					if(setNewBest)
					{
						bestdx = testdx;
						bestdy = testdy;
						bestPoint = iPoint;
					}
				}
			}
			iPoint = (this.point.length + iPoint - 1)%this.point.length;
		} while(iPoint != prevPoint);
		this.currentPoint = bestPoint;
		//		this.currentPoint = (this.point.length + this.currentPoint - 1)%this.point.length;
	}
	else if(SLVDE.keyFirstDown == "d" || SLVDE.keyFirstDown == "right") //Right
	{
		do //While index point does not equal original point
		{
			var isRight = this.point[iPoint].x > this.point[prevPoint].x;
			if(isRight)
			{
				isUnderUpperBound = this.point[iPoint].y >= -this.point[iPoint].x + this.point[prevPoint].x + this.point[prevPoint].y;
				isAboveLowerBound = this.point[iPoint].y <= this.point[iPoint].x - this.point[prevPoint].x + this.point[prevPoint].y;
			}
			else
			{
				isUnderUpperBound = this.point[iPoint].y >= -this.point[iPoint].x + (this.point[prevPoint].x - SLVDE.SCREENX) + this.point[prevPoint].y;
				isAboveLowerBound = this.point[iPoint].y <= this.point[iPoint].x - (this.point[prevPoint].x - SLVDE.SCREENX) + this.point[prevPoint].y;
			}
			if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
			{
				testdx =  this.point[iPoint].x - this.point[prevPoint].x;
				if(!isRight) testdx += SLVDE.SCREENX;
				testdy = Math.abs(this.point[prevPoint].y - this.point[iPoint].y);
				if(testdx <= bestdx)
				{
					setNewBest = true;
					if(testdx == bestdx && testdy > bestdy) setNewBest = false;
					if(setNewBest)
					{
						bestdx = testdx;
						bestdy = testdy;
						bestPoint = iPoint;
					}
				}
			}
			iPoint = (iPoint + 1)%this.point.length;
		} while(iPoint != prevPoint);
		this.currentPoint = bestPoint;
		//this.currentPoint = (this.currentPoint + 1)%this.point.length;
	}
	else if(SLVDE.keyFirstDown == "s" || SLVDE.keyFirstDown == "down") //Down
	{
		do //While index point does not equal original point
		{
			var isDown = this.point[iPoint].y > this.point[prevPoint].y;
			if(isDown)
			{
				isUnderUpperBound = this.point[iPoint].x >= -this.point[iPoint].y + this.point[prevPoint].y + this.point[prevPoint].x;
				isAboveLowerBound = this.point[iPoint].x <= this.point[iPoint].y - this.point[prevPoint].y + this.point[prevPoint].x;
			}
			else
			{
				isUnderUpperBound = this.point[iPoint].x >= -this.point[iPoint].y + (this.point[prevPoint].y - SLVDE.SCREENY) + this.point[prevPoint].x;
				isAboveLowerBound = this.point[iPoint].x <= this.point[iPoint].y - (this.point[prevPoint].y - SLVDE.SCREENY) + this.point[prevPoint].x;
			}
			if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
			{
				testdy = this.point[iPoint].y - this.point[prevPoint].y;
				if(!isDown) testdy += SLVDE.SCREENY;
				testdx = Math.abs(this.point[prevPoint].x - this.point[iPoint].x);
				if(testdy <= bestdy)
				{
					setNewBest = true;
					if(testdy == bestdy && testdx > bestdx) setNewBest = false;
					if(setNewBest)
					{
						bestdx = testdx;
						bestdy = testdy;
						bestPoint = iPoint;
					}
				}
			}
			iPoint = (iPoint + 1)%this.point.length;
		} while(iPoint != prevPoint);
		this.currentPoint = bestPoint;
//		this.currentPoint = (this.currentPoint + 1)%this.point.length;
	}
};

//File selection SLVDE.menu
SLVDE.setupFileSelect = function() {
	opMenu.killPoints();
	opMenu.cursor = SLVDE.image["torchCursor.png"];
	opMenu.background = SLVDE.buffer;

	SLVDE.canvasBlackout(SLVDE.bufferCtx);
	SLVDE.bufferCtx.fillStyle = "#FFFFFF";
	SLVDE.bufferCtx.font = "20px Arial";
	SLVDE.bufferCtx.fillText("Select a file.", 10, 30);
	for(var col = 0; col < 3; col++)
	{
		for(var index = 1; index <= 7; index++)
		{
			var fileName = (index + col*7);
			SLVDE.bufferCtx.fillText(fileName, 40 + 200*col, 10 + 60*index);
			opMenu.addPoint(10 + 200*col, 60*index);
			try
			{
				var item = localStorage.getItem(GAMEID + "_" + fileName + "_SAVE");
				var tSAVE = JSON.parse(item);
				SLVDE.bufferCtx.fillText(tSAVE.timeDays + "." + tSAVE.timeHours + "." + tSAVE.timeMinutes + "." + tSAVE.timeSeconds, 40 + 200*col, 35 + 60*index);
			}
			catch(e)
			{
				SLVDE.bufferCtx.fillText("No Save Data", 40 + 200*col, 35 + 60*index);
			}
		}
	}
};

SLVDE.setupActionMenu = function() {
	opMenu.killPoints();
	opMenu.cursor = SLVDE.image["blueSquare.png"];
	opMenu.background = SLVDE.buffer;

	SLVDE.canvasBlackout(SLVDE.bufferCtx);
	SLVDE.bufferCtx.fillStyle = "#FFFFFF";
	SLVDE.bufferCtx.font = "20px Arial";
	SLVDE.bufferCtx.fillText("Select a file.", 10, 30);
	for(var col = 0; col < 3; col++)
	{
		for(var index = 1; index <= 7; index++)
		{
			var fileName = "File " + (index + col*7);
			SLVDE.bufferCtx.fillText(fileName, 40 + 200*col, 10 + 60*index);
			opMenu.addPoint(10 + 200*col, 60*index);
			try
			{
				var item = localStorage.getItem("FULLMAVEN_" + fileName + "_SAVE");
				var tSAVE = JSON.parse(item);
				SLVDE.bufferCtx.fillText(tSAVE.timeDays + "." + tSAVE.timeHours + "." + tSAVE.timeMinutes + "." + tSAVE.timeSeconds, 40 + 200*col, 35 + 60*index);
			}
			catch(e)
			{
				SLVDE.bufferCtx.fillText("No Save Data", 40 + 200*col, 35 + 60*index);
			}
		}
	}
};

SLVDE.drawAwesomeRect = function(sx, sy, ex, ey, context, px, py, down) {
	context.beginPath();
	context.moveTo(sx + 10, sy);
	if(px && py && down)
	{
		context.lineTo((sx + ex)/2 - 10, sy);
		context.lineTo(px, py);
		context.lineTo((sx + ex)/2 + 10, sy);
	}
	context.lineTo(ex - 10, sy);
	context.arc(ex - 10, sy + 10, 10, 1.5*Math.PI, 0*Math.PI, false);
	context.lineTo(ex, ey - 10);
	context.arc(ex - 10, ey - 10, 10, 0, 0.5*Math.PI, false);
	if(px && py && !down)
	{
		context.lineTo((sx + ex)/2 + 10, ey);
		context.lineTo(px, py);
		context.lineTo((sx + ex)/2 - 10, ey);
	}
	context.lineTo(sx + 10, ey);
	context.arc(sx + 10, ey - 10, 10, 0.5*Math.PI, 1*Math.PI, false);
	context.lineTo(sx, sy + 10);
	context.arc(sx + 10, sy + 10, 10, 1*Math.PI, 1.5*Math.PI, false);
	context.closePath();

	context.strokeStyle = "rgba(255, 255, 255, .8)";
	context.lineWidth = 3;
	context.stroke();

	var grd = context.createLinearGradient(0, sy, 0, ey);
	grd.addColorStop(0, "rgba(50, 100, 200, .4)");
	grd.addColorStop("0.5", "rgba(50, 100, 220, .9)");
	grd.addColorStop(1, "rgba(50, 100, 200, .4)");
	context.fillStyle = grd;
	context.fill();
};

SLVDE.personSays = function(persOb, message, overrideName) {
	SLVDE.renderBoardState(); //in SLVDE.main.js

	var tSpkr = overrideName || persOb.name;

	var px = persOb.x - SLVDE.wX;
	var py = persOb.y - SLVDE.wY - persOb.yres + persOb.baseY - 5;
	//if(persOb.y - SLVDE.wY < 220) py = persOb.y - SLVDE.wY - persOb.yres + 40;

	SLVDE.speechBubble(message, tSpkr, px, py);
};

SLVDE.say = function(message) {
	SLVDE.renderBoardState();
	SLVDE.speechBubble(message);
};

SLVDE.speechBubble = function(msg, spkr, px, py) {
	//Used in message case of engine to grab single line of text
	function getLine(str, leng) {
		SLVDE.see.font = "18px Verdana";
		if(!str)
		{
			return null;
		}
		var word = str.split(" ");
		var lin = "";
		var wid = SLVDE.see.measureText(lin).width;
		for(var index = 0; wid < leng; index++)
		{
			if(word[index])
			{
				lin += word[index] + " ";
				wid = SLVDE.see.measureText(lin).width;
			}
			else
			{
				break;
			}
		}
		if(wid > leng)
		{
			lin = lin.substr(0, -word[index - 1].length - 1);
		}
		return lin;
	}

	var line = [];

	while(msg.length > 0)
	{
		var linNum = line.length;
		line[linNum] = getLine(msg, 560);
		//alert("'" + line[linNum] + "'");
		msg = msg.substr(line[linNum].length, msg.length - line[linNum].length);
	}

	var yShift = py - ((line.length)*20 + 70);
	if((line.length)*20 + 50 > py)
	{
		yShift = py + 40;
		py += 35;
	}
	if(!py) yShift = 0;

	//Text box
	SLVDE.drawAwesomeRect(SLVDE.SCREENX/2 - 300, yShift + 30, SLVDE.SCREENX/2 + 300, yShift + (line.length)*20 + 40, SLVDE.see, px, py, (line.length)*20 + 50 > py);

	SLVDE.see.fillStyle="#FFFFFF";
	SLVDE.see.font="18px Verdana";
	//Lines
	for(var index = 0; index < line.length; index++)
	{
		SLVDE.see.fillText(line[index], SLVDE.SCREENX/2 - 290, yShift + 20*index + 50);
	}

	if(spkr)
	{
		//Name box
		SLVDE.drawAwesomeRect(SLVDE.SCREENX/2 - 300, yShift, SLVDE.see.measureText(spkr).width + SLVDE.SCREENX/2 - 260, yShift + 30, SLVDE.see);

		SLVDE.see.fillStyle="#FFFFFF";
		SLVDE.see.font="18px Verdana";

		//Name
		SLVDE.see.fillText(spkr, SLVDE.SCREENX/2 - 280, yShift + 20);
	}
};
