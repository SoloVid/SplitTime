SplitTime.Trace = {};

SplitTime.Trace.draw = function(traceStr, ctx, type, offsetPos) {
	var color = SplitTime.Trace.getColor(type);
	return SplitTime.Trace.drawColor(traceStr, ctx, color, offsetPos);
};

SplitTime.Trace.extractArray = function(traceStr) {
	var pointsArr = [];
    var regex = /\([^\)]+\)/g;
    var xRegex = /\(([-]?[\d]+),/;
    var yRegex = /,[\s]*([-]?[\d]+)\)/;

    var points = traceStr.match(regex);
    //console.log(points.length + "|" + points + "|");

    if(points.length === 0) {
        log.warn("Empty trace string: " + traceStr);
        return;
    }

    for(var i = 0; i < points.length; i++)
    {
        if(points[i] == "(close)") {
        	pointsArr.push(null);
        } else {
            var xMatch = points[i].match(xRegex);
            var yMatch = points[i].match(yRegex);
            if(xMatch === null || yMatch === null) {
                console.warn("Invalid trace point " + points[i] + "(" + i + " point) in trace string \"" + traceStr + "\"");
                continue;
            }

            pointsArr.push({
				x: +(xMatch[1]),
				y: +(yMatch[1])
			});
        }
    }
    return pointsArr;
};

SplitTime.Trace.drawColor = function(traceStr, ctx, color, offsetPos) {
	if(!offsetPos) {
		offsetPos = {x: 0, y: 0};
	}
	ctx.strokeStyle = color;
	ctx.fillStyle = ctx.strokeStyle;

	var regex = /\([^\)]+\)/g;
	var xRegex = /\(([-]?[\d]+),/;
	var yRegex = /,[\s]*([-]?[\d]+)\)/;
	var newX, newY;

	var pointStr = traceStr;
	var points = pointStr.match(regex);
	//console.log(points.length + "|" + points + "|");

	if(points.length === 0) {
		log.warn("Empty trace string: " + traceStr);
		return;
	}

	ctx.beginPath();

	var xMatch = points[0].match(xRegex);
	var yMatch = points[0].match(yRegex);
	if(!xMatch || !yMatch) {
		console.warn("Invalid trace point " + points[0] + " in trace string \"" + traceStr + "\"");
		return;
	}

	newX = +(xMatch[1]) + offsetPos.x;
	newY = +(yMatch[1]) + offsetPos.y;

	ctx.moveTo(newX, newY);

	ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);

	for(var k = 1; k < points.length; k++)
	{
		if(points[k] == "(close)")
		{
			ctx.closePath();
			ctx.stroke();
			ctx.fill();
		}
		else
		{
			xMatch = points[k].match(xRegex);
			yMatch = points[k].match(yRegex);
			if(!xMatch || !yMatch) {
				console.warn("Invalid trace point " + points[k] + " in trace string \"" + traceStr + "\"");
				continue;
			}

			newX = +(xMatch[1]) + offsetPos.x;
			newY = +(yMatch[1]) + offsetPos.y;

			ctx.lineTo(newX, newY);
			ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);
		}
	}
	ctx.stroke();
};

SplitTime.Trace.Type = {
	SOLID: "solid",
	FUNCTION: "function",
	VOID: "void"
};

SplitTime.Trace.RColor = {
	SOLID: 255,
	FUNCTION: 100
};
SplitTime.Trace.typeToColor = {
	"solid": [255, 0, 0, 1],
	"void": [255, 0, 255, 1],
	"function": [100, 0, 0, 1],
	"path": [0, 0, 0, 1],
	"stairDown": [0, 255, 0, 1],
	"stairUp": [0, 255, 0, 1]
};
SplitTime.Trace.colorToType = {};

for(var color in SplitTime.Trace.typeToColor) {
	SplitTime.Trace.colorToType[SplitTime.Trace.typeToColor[color].join(",")] = color;
}

SplitTime.Trace.getColor = function(type) {
	return "rgba(" + SplitTime.Trace.typeToColor[type].join(", ") + ")";
};
SplitTime.Trace.getType = function(r, g, b, a) {
	if(a === undefined) {
		a = 1;
	}
	return SplitTime.Trace.colorToType[r + "," + g + "," + b + "," + a];
};

SplitTime.Trace.getFunctionColor = function(id) {
	var b = id % 256;
	var g = Math.floor(id / 256);
	return "rgba(" + SplitTime.Trace.RColor.FUNCTION + ", " + g + ", " + b + ", 1)";
};

SplitTime.Trace.getFunctionIdFromColor = function(r, g, b, a) {
	return b + 256 * g;
};
