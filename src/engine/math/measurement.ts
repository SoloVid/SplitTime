namespace SplitTime.measurement {
	export function distanceEasy(x1: number, y1: number, x2: number, y2: number) {
		return Math.abs(x1 - x2) + Math.abs(y1 - y2);
	};
	
	export function distanceTrue(x1: number, y1: number, x2: number, y2: number) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	};
	
	//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
	export function xPixToTile(x: number) {
		return Math.round((x-7)/32);
	};
	export function xTileToPix(x: number) {
		return (x*32)+7;
	};
	export function yPixToTile(y: number) {
		return Math.round((y-21)/32);
	};
	export function yTileToPix(y: number) {
		return (y*32)+21;
	};
}

namespace SplitTime {
	export type unit = -1 | 1;
	export type unitOrZero = unit | 0;
}
