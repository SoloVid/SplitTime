SplitTime.Level = function(levelId) {
    this.id = levelId;
    this.functions = {};
    this.positions = {};
};

SplitTime.Level.map = {};

SplitTime.Level.get = function(levelId) {
    if(!SplitTime.Level.map[levelId]) {
        SplitTime.Level.map[levelId] = new SplitTime.Level(levelId);
    }
    return SplitTime.Level.map[levelId];
};

SplitTime.Level.prototype.getPosition = function(positionId) {
    return this.positions[positionId];
};

SplitTime.Level.prototype.registerFunction = function(functionId, fun) {
    this.functions[functionId] = fun;
};

SplitTime.Level.prototype.registerPosition = function(positionId, position) {
    this.positions[positionId] = position;
};

SplitTime.Level.prototype.runFunction = function(functionId) {
    var fun = this.functions[functionId] || function() { };
    fun();
};
