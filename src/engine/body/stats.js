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
SplitTime.Body.prototype.getPixelSpeedForFrame = function(speed) {
    speed = speed || this.spd;
    return speed * this.getLevel().getRegion().TimeStabilizer.howManyMsSinceLastFrame() / 1000;
};
SplitTime.Body.prototype.getPixelGravityForFrame = function() {
    return this.GRAVITY * this.getLevel().getRegion().TimeStabilizer.howManyMsSinceLastFrame() / 1000;
};
SplitTime.Body.prototype.getPixelZVelocityForFrame = function(zVelocity) {
    zVelocity = zVelocity || this.zVelocity;
    return zVelocity * this.getLevel().getRegion().TimeStabilizer.howManyMsSinceLastFrame() / 1000;
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
