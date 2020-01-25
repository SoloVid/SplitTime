namespace SplitTime {
	export function delay(seconds: number): Promise<unknown> {
		var promise = new Promise(resolve => {
			setTimeout(function() {
				resolve();
			}, seconds * 1000);
		});
		return promise;
	};
	
	//Black out canvas
	export function canvasBlackout(canv: CanvasRenderingContext2D) {
		canv.fillStyle="#000000";
		canv.fillRect(0, 0, 640, 480);
	};
	
	//Deal damage from, to
	export function damage(attacker: { hp: number; strg: number; }, victim: { onHit: undefined; hp: number; strg: number; }) {
		if(victim.onHit === undefined) {
			if(attacker.hp) {
				// var atk = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.atk;
				// var def = (attacker.hp/attacker.maxHp)*(attacker.strg - attacker.weight) + attacker.def;
				var atk = (attacker.hp/attacker.strg)*(attacker.strg/* - attacker.weight*/) + 20;//attacker.atk;
				var def = (victim.hp/victim.strg)*(victim.strg/* - attacker.weight*/) + 20;//attacker.def;
				victim.hp -= atk - ((atk/(Math.PI/2))*Math.atan(Math.pow(def,0.7)/(atk/10)));//(attacker.hp/100)*(attacker.strg/victim.strg)*40;
			}
		}
	};
	
	/**
	* Gets the index on canvas data of given coordinates
	* @param {int} x
	* @param {int} y
	* @param {ImageData} data Collision canvas data array
	* @returns {int}
	*/
	export function pixCoordToIndex(x: int,y: int,data: ImageData): int {
		return (y*data.width + x)*4;
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
