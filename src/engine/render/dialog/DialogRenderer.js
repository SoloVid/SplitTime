dependsOn("../HUDRenderer.js");
dependsOn("Dialog.js");

SplitTime.Dialog.Renderer = {};

SplitTime.HUD.pushRenderer(SplitTime.Dialog.Renderer);

/**
 * @type {DialogDrawing[]}
 */
var dialogDrawings = [];

SplitTime.Dialog.Renderer.show = function(dialog) {
    dialogDrawings.push(new DialogDrawing(dialog));
};

SplitTime.Dialog.Renderer.hide = function(dialog) {
	for(var i = 0; i < dialogDrawings.length; i++) {
		if(dialogDrawings[i].dialog === dialog) {
			dialogDrawings[i].in = false;
		}
	}
};

SplitTime.Dialog.Renderer.notifyFrameUpdate = function() {
    for(var i = dialogDrawings.length - 1; i >= 0; i--) {
        var drawing = dialogDrawings[i];
        if(drawing.in) {
        	drawing.visibility = Math.min(drawing.visibility + 0.1, 1);
		} else {
        	drawing.visibility -= 0.1;
        	if(drawing.visibility < 0) {
        		dialogDrawings.splice(i, 1);
			}
		}
    }
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Dialog.Renderer.renderDialogs = function(ctx) {
    for(var i = 0; i < dialogDrawings.length; i++) {
        // TODO: visibility
		var drawing = dialogDrawings[i];
		var dialog = drawing.dialog;
		var location = dialog.getLocation();
		sayFromBoardFocalPoint(ctx, {x: location.getX(), y: location.getY()},
			dialog.getFullCurrentLine(), dialog.getDisplayedCurrentLine(), dialog.getSpeaker());
    }
};

/**
 * @param {SplitTime.Dialog} dialog
 * @class
 */
function DialogDrawing(dialog) {
	this.dialog = dialog;
	this.in = true;
	this.visibility = 0;
}

/**
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} [pointX]
 * @param {number} [pointY]
 * @param {boolean} [isDown]
 */
function drawAwesomeRect(left, top, right, bottom, ctx, pointX, pointY, isDown) {
	ctx.beginPath();
	ctx.moveTo(left + 10, top);
	if(pointX && pointY && isDown) {
		ctx.lineTo((left + right)/2 - 10, top);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo((left + right)/2 + 10, top);
	}
	ctx.lineTo(right - 10, top);
	ctx.arc(right - 10, top + 10, 10, 1.5*Math.PI, 0, false);
	ctx.lineTo(right, bottom - 10);
	ctx.arc(right - 10, bottom - 10, 10, 0, 0.5*Math.PI, false);
	if(pointX && pointY && !isDown) {
		ctx.lineTo((left + right)/2 + 10, bottom);
		ctx.lineTo(pointX, pointY);
		ctx.lineTo((left + right)/2 - 10, bottom);
	}
	ctx.lineTo(left + 10, bottom);
	ctx.arc(left + 10, bottom - 10, 10, 0.5*Math.PI, Math.PI, false);
	ctx.lineTo(left, top + 10);
	ctx.arc(left + 10, top + 10, 10, Math.PI, 1.5*Math.PI, false);
	ctx.closePath();

	ctx.strokeStyle = "rgba(255, 255, 255, .8)";
	ctx.lineWidth = 3;
	ctx.stroke();

	var grd = ctx.createLinearGradient(0, top, 0, bottom);
	grd.addColorStop(0, "rgba(50, 100, 200, .4)");
	grd.addColorStop(0.5, "rgba(50, 100, 220, .9)");
	grd.addColorStop(1, "rgba(50, 100, 200, .4)");
	ctx.fillStyle = grd;
	ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} focalPoint
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {string} speakerName
 */
function sayFromBoardFocalPoint(ctx, focalPoint, fullMessage, displayedMessage, speakerName) {
	var pointRelativeToScreen = SplitTime.BoardRenderer.getRelativeToScreen(focalPoint);
    drawSpeechBubble(ctx, fullMessage, displayedMessage, speakerName, pointRelativeToScreen.x, pointRelativeToScreen.y);
}

var FONT = "18px Verdana";
var MAX_ROW_CHARACTERS = 560;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} fullMessage
 * @param {string} displayedMessage
 * @param {string} [speakerName]
 * @param {number} [pointX]
 * @param {number} [pointY]
 */
function drawSpeechBubble(ctx, fullMessage, displayedMessage, speakerName, pointX, pointY) {
    var allLines = getLinesFromMessage(fullMessage, ctx);

	var yShift = pointY - ((allLines.length)*20 + 70);
	if((allLines.length)*20 + 50 > pointY) {
		yShift = pointY + 40;
		pointY += 35;
	}
	if(!pointY) {
		yShift = 0;
	}

	//Text box
	drawAwesomeRect(SplitTime.SCREENX/2 - 300, yShift + 30, SplitTime.SCREENX/2 + 300, yShift + (allLines.length)*20 + 40, SplitTime.see, pointX, pointY, (allLines.length)*20 + 50 > pointY);

	SplitTime.see.fillStyle="#FFFFFF";
	SplitTime.see.font=FONT;
    //Lines
    var drawnLines = getLinesFromMessage(displayedMessage, ctx);
	for(var index = 0; index < drawnLines.length; index++) {
		SplitTime.see.fillText(drawnLines[index], SplitTime.SCREENX/2 - 290, yShift + 20*index + 50);
	}

	if(speakerName) {
		//Name box
		drawAwesomeRect(SplitTime.SCREENX/2 - 300, yShift, SplitTime.see.measureText(speakerName).width + SplitTime.SCREENX/2 - 260, yShift + 30, SplitTime.see);

		SplitTime.see.fillStyle="#FFFFFF";
		SplitTime.see.font="18px Verdana";

		//Name
		SplitTime.see.fillText(speakerName, SplitTime.SCREENX/2 - 280, yShift + 20);
	}
}

/**
 * @param {string} message
 * @param {CanvasRenderingContext2D} ctx
 */
function getLinesFromMessage(message, ctx) {
    function getLine(str) {
    	var initialFont = ctx.font;
        ctx.font = FONT;
        if(!str) {
            return null;
        }
        var words = str.split(" ");
        var nextWord = words.shift();
        var line = nextWord;
        var width = ctx.measureText(line).width;
        while(words.length > 0 && width < MAX_ROW_CHARACTERS) {
        	nextWord = words.shift();
        	line += " " + nextWord;
            width = ctx.measureText(line).width;
		}

		if(width > MAX_ROW_CHARACTERS && line !== nextWord) {
        	words.unshift(nextWord);
        	line = line.substr(0, -nextWord.length - 1);
		}

        ctx.font = initialFont;
        return line;
    }

    var lines = [];

    while(message.length > 0) {
        var i = lines.length;
        lines[i] = getLine(message);
        message = message.substr(lines[i].length, message.length - lines[i].length).trim();
    }

    return lines;
}
