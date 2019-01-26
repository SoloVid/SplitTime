//Black out canvas
SplitTime.canvasBlackout = function(canv) {
	canv.fillStyle="#000000";
	canv.fillRect(0, 0, 640, 480);
};

//Deal damage from, to
SplitTime.damage = function(attacker, victim) {
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
SplitTime.pixCoordToIndex = function(x,y,data) {
	return (y*data.width + x)*4;
};

//Like SplitTime.enterLevelById() with coordinates
SplitTime.send = function(board, x, y, z) {
    var player = SplitTime.Player.getActiveBody();
    player.put(board, x, y, z);
    SplitTime.Level.setCurrent(board);
};

SplitTime.sendToPosition = function(position) {
    var player = SplitTime.Player.getActiveBody();
    player.putInPosition(position);
    SplitTime.Level.setCurrent(position.getLevel());
};

//Functions to convert between actual pixel locations and tile-based locations. All begin with 0, 0 as top left. Rounding is employed to ensure all return values are integers
SplitTime.xPixToTile = function(x) {
	return Math.round((x-7)/32);
};
SplitTime.xTileToPix = function(x) {
	return (x*32)+7;
};
SplitTime.yPixToTile = function(y) {
	return Math.round((y-21)/32);
};
SplitTime.yTileToPix = function(y) {
	return (y*32)+21;
};
