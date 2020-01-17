namespace SplitTime.file {
    var callbacks: SLVD.RegisterCallbacks;
    defer(() => {
        callbacks = new SLVD.RegisterCallbacks();
    });
    var gameId: string | number;

    export function setGameId(id: string | number) {
        gameId = id;
    };

    export function onNew(callback: () => void) {
        callbacks.register(callback);
    };

    export function loadNew(): Promise<void> {
        callbacks.run();
        return Promise.resolve();
    };

    export function load(fileName: string) {
        // TODO: implement
    };

    export function saveAs(fileName: string) {
        // TODO: implement
    };
}
