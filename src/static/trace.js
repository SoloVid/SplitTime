SplitTime.Trace = {};

SplitTime.Trace.draw = function(traceStr, ctx, color, offsetPos)
{
	if(!offsetPos)
	{
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
