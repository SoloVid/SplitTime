namespace SplitTime.Measurement {
	export function distanceEasy(x1, y1, x2, y2) {
		return Math.abs(x1 - x2) + Math.abs(y1 - y2);
	};
	
	export function distanceTrue(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	};
	
	//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
	export function xPixToTile(x) {
		return Math.round((x-7)/32);
	};
	export function xTileToPix(x) {
		return (x*32)+7;
	};
	export function yPixToTile(y) {
		return Math.round((y-21)/32);
	};
	export function yTileToPix(y) {
		return (y*32)+21;
	};
}
