dependsOn("/SLVD/SLVD.js");

SLVD.Bresenham = {};

/**
 * Bresenham's line algorithm as implemented in https://stackoverflow.com/a/11683720/4639640
 * @param {int} x0
 * @param {int} y0
 * @param {int} x1
 * @param {int} y1
 * @param {function(x: int, y: int)} callback
 */
SLVD.Bresenham.forEachPoint = function(x0, y0, x1, y1, callback) {
    var w = x1 - x0;
    var h = y1 - y0;
    var dx1 = w > 0 ? 1 : -1;
    var dy1 = h > 0 ? 1 : -1;
    var dx2 = dx1;
    var dy2 = 0;

    var longest = Math.abs(w);
    var shortest = Math.abs(h);
    if(longest < shortest) {
        longest = Math.abs(h);
        shortest = Math.abs(w);
        dy2 = h > 0 ? 1 : -1;
        dx2 = 0;
    }

    var x = x0;
    var y = y0;
    var numerator = longest >> 1;
    for (var i = 0; i < longest; i++) {
        if(callback(x, y)) {
            return;
        }
        numerator += shortest;
        if(numerator > longest) {
            numerator -= longest;
            x += dx1;
            y += dy1;
        } else {
            x += dx2;
            y += dy2;
        }
    }
};
