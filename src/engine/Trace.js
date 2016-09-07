SplitTime.Trace = {};

SplitTime.Trace.draw = function(traceStr, ctx, type, offsetPos) {
	if(!offsetPos)
	{
		offsetPos = {x: 0, y: 0};
	}
	ctx.strokeStyle = SplitTime.getColor(type);
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

SplitTime.Trace.typeToColor = {
	"solid": [0, 0, 255, 1],
	"void": [255, 0, 255, 1],
	"function": [254, 0, 0, 1],
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
