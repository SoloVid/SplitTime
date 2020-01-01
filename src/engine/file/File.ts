namespace SplitTime.file {
    var callbacks = new SLVD.RegisterCallbacks();
    var gameId;

    export function setGameId(id) {
        gameId = id;
    };

    export function onNew(callback) {
        callbacks.registerCallback(callback);
    };

    export function loadNew() {
        callbacks.runCallbacks();
        return SLVD.Promise.as();
    };

    export function load(fileName) {
        // TODO: implement
    };

    export function saveAs(fileName) {
        // TODO: implement
    };
}
