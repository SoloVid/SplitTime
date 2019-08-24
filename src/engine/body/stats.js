dependsOn("Body.js");

SplitTime.Body.prototype.team = "neutral";
SplitTime.Body.prototype.getTeam = function() {
    return SplitTime.Teams[this.team];
};

SplitTime.Body.prototype.hp = 100;
SplitTime.Body.prototype.strg = 5;
// Generally equates to pixels per second (game time)
SplitTime.Body.prototype.spd = 2;

SplitTime.Body.prototype.getHp = function() {
    return this.hp;
};
SplitTime.Body.prototype.getMaxHp = function() {
    return 100;
};
SplitTime.Body.prototype.getSpeed = function() {
    return this.spd;
};
SplitTime.Body.prototype.getStrength = function() {
    return this.strg;
};
SplitTime.Body.prototype.damage = function(amount) {
    this.hp -= amount;

    if(this.hp <= 0) {
        // TODO: maybe call some registered callback?
    }
};
