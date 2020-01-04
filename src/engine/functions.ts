namespace SplitTime {
	export function delay(seconds) {
		var formerProcess = SplitTime.process;
		SplitTime.process = SplitTime.main.State.OTHER;
		var promise = new SLVD.Promise();
		setTimeout(function() {
			SplitTime.process = formerProcess;
		}, seconds * 1000);
		return promise;
	};
	
	//Black out canvas
	export function canvasBlackout(canv) {
		canv.fillStyle="#000000";
		canv.fillRect(0, 0, 640, 480);
	};
	
	//Deal damage from, to
	export function damage(attacker, victim) {
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
	export function pixCoordToIndex(x,y,data) {
		return (y*data.width + x)*4;
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
