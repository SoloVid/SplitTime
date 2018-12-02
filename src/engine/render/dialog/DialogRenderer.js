dependsOn("Dialog.js");

SplitTime.Dialog.Renderer = {};

SplitTime.Dialog.Renderer.drawAwesomeRect = function(sx, sy, ex, ey, context, px, py, down) {
	context.beginPath();
	context.moveTo(sx + 10, sy);
	if(px && py && down) {
		context.lineTo((sx + ex)/2 - 10, sy);
		context.lineTo(px, py);
		context.lineTo((sx + ex)/2 + 10, sy);
	}
	context.lineTo(ex - 10, sy);
	context.arc(ex - 10, sy + 10, 10, 1.5*Math.PI, 0*Math.PI, false);
	context.lineTo(ex, ey - 10);
	context.arc(ex - 10, ey - 10, 10, 0, 0.5*Math.PI, false);
	if(px && py && !down) {
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

SplitTime.Dialog.Renderer.personSays = function(persOb, message, overrideName) {
	// SplitTime.renderBoardState(); //in SplitTime.main.js

	var tSpkr = overrideName || persOb.name;

    var px = SplitTime.BoardRenderer.getRelativeToScreen(persOb);
    var py = SplitTime.BoardRenderer.getRelativeToScreen(persOb) - persOb.yres + persOb.baseY - 5;
	//if(persOb.y - SplitTime.wY < 220) py = persOb.y - SplitTime.wY - persOb.yres + 40;

	SplitTime.Dialog.Renderer.speechBubble(message, tSpkr, px, py);
};

SplitTime.Dialog.Renderer.say = function(message) {
	// SplitTime.renderBoardState();
	SplitTime.Dialog.Renderer.speechBubble(message);
};

SplitTime.Dialog.Renderer.speechBubble = function(msg, spkr, px, py) {
	//Used in message case of engine to grab single line of text
	function getLine(str, leng) {
		SplitTime.see.font = "18px Verdana";
		if(!str) {
			return null;
		}
		var word = str.split(" ");
		var lin = "";
		var wid = SplitTime.see.measureText(lin).width;
		for(var index = 0; wid < leng; index++) {
			if(word[index]) {
				lin += word[index] + " ";
				wid = SplitTime.see.measureText(lin).width;
			} else {
				break;
			}
		}
		if(wid > leng) {
			lin = lin.substr(0, -word[index - 1].length - 1);
		}
		return lin;
	}

	var line = [];

	while(msg.length > 0) {
		var linNum = line.length;
		line[linNum] = getLine(msg, 560);
		//alert("'" + line[linNum] + "'");
		msg = msg.substr(line[linNum].length, msg.length - line[linNum].length);
	}

	var yShift = py - ((line.length)*20 + 70);
	if((line.length)*20 + 50 > py) {
		yShift = py + 40;
		py += 35;
	}
	if(!py) yShift = 0;

	//Text box
	SplitTime.Dialog.Renderer.drawAwesomeRect(SplitTime.SCREENX/2 - 300, yShift + 30, SplitTime.SCREENX/2 + 300, yShift + (line.length)*20 + 40, SplitTime.see, px, py, (line.length)*20 + 50 > py);

	SplitTime.see.fillStyle="#FFFFFF";
	SplitTime.see.font="18px Verdana";
	//Lines
	for(var index = 0; index < line.length; index++) {
		SplitTime.see.fillText(line[index], SplitTime.SCREENX/2 - 290, yShift + 20*index + 50);
	}

	if(spkr) {
		//Name box
		SplitTime.Dialog.Renderer.drawAwesomeRect(SplitTime.SCREENX/2 - 300, yShift, SplitTime.see.measureText(spkr).width + SplitTime.SCREENX/2 - 260, yShift + 30, SplitTime.see);

		SplitTime.see.fillStyle="#FFFFFF";
		SplitTime.see.font="18px Verdana";

		//Name
		SplitTime.see.fillText(spkr, SplitTime.SCREENX/2 - 280, yShift + 20);
	}
};
