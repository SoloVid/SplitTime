dependsOn("/SLVD/RegisterCallbacks.js");

SplitTime.File = {};

(function() {
    var callbacks = new SLVD.RegisterCallbacks();
    var gameId;

    SplitTime.File.setGameId = function(id) {
        gameId = id;
    };

    SplitTime.File.onNew = function(callback) {
        callbacks.register(callback);
    };

    SplitTime.File.loadNew = function() {
        callbacks.run();
        return SLVD.Promise.as();
    };

    SplitTime.File.load = function(fileName) {
        // TODO: implement
    };

    SplitTime.File.saveAs = function(fileName) {
        // TODO: implement
    };
} ());