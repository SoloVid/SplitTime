SplitTime.Direction = {
	E: 0,
	N: 1,
	W: 2,
	S: 3,
	NE: 0.5,
	EN: 0.5,
	NW: 1.5,
	WN: 1.5,
	SW: 2.5,
	WS: 2.5,
	SE: 3.5,
	ES: 3.5
};

SplitTime.Direction.fromString = function(stringDir) {
	if(stringDir in SplitTime.Direction) {
		return SplitTime.Direction[stringDir];
	} else {
        console.warn("Invalid direction: " + stringDir);
        return -1;
	}
};
SplitTime.Direction.toString = function(numDir) {
	switch(numDir) {
		case 0: return "E";
		case 1: return "N";
		case 2: return "W";
		case 3: return "S";
		default:
			if(numDir < 1) return "NE";
			else if(numDir < 2) return "NW";
			else if(numDir < 3) return "SW";
			else return "SE";
	}
};

//Get direction from one point to another (both in Maven orientation)
SplitTime.Direction.fromTo = function(fromX, fromY, toX, toY) {
	if(fromX == toX) {
		if(fromY < toY) return 3;
		else return 1;
	}

	var baseDir = -Math.atan((fromY - toY)/(fromX - toX))/(Math.PI/2);

    //not in atan range
	if(fromX > toX) {
		baseDir += 2;
	}

	return (baseDir + 4) % 4;
};
