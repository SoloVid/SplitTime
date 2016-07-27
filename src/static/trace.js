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
//	console.log(points.length + "|" + points + "|");

	ctx.beginPath();

	newX = +(points[0].match(xRegex)[1]) + offsetPos.x;
	newY = +(points[0].match(yRegex)[1]) + offsetPos.y;

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
			newX = +(points[k].match(xRegex)[1]) + offsetPos.x;
			newY = +(points[k].match(yRegex)[1]) + offsetPos.y;

			ctx.lineTo(newX, newY);
			ctx.stroke();
			ctx.fillRect(newX - 0.5, newY - 0.5, 1, 1);
		}
	}
};

SplitTime.Trace.getColor = function(type) {
	switch(type) {
		case "solid": return "rgba(0, 0, 255, 1)";
		case "void": return "rgba(0, 255, 255, 1)";
		case "function": return "rgba(255, 0, 0, 1)";
		case "path": return "rgba(0, 0, 0, 1)";
		case "stairDown": case "stairUp": return "rgba(0, 255, 0, 1)";
	}
};
