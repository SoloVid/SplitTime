SplitTime.Measurement = {};

SplitTime.Measurement.distanceEasy = function(x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

SplitTime.Measurement.distanceTrue = function(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
SplitTime.Measurement.xPixToTile = function(x) {
	return Math.round((x-7)/32);
};
SplitTime.Measurement.xTileToPix = function(x) {
	return (x*32)+7;
};
SplitTime.Measurement.yPixToTile = function(y) {
	return Math.round((y-21)/32);
};
SplitTime.Measurement.yTileToPix = function(y) {
	return (y*32)+21;
};
