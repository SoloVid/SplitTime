namespace SplitTime.file {
    export class Bank {
        private onNewCallbacks: SLVD.RegisterCallbacks = new SLVD.RegisterCallbacks();

        constructor(private id: string | number) {

        }

        // This function is only here because of the singleton pattern.
        // FTODO: consider removing to reduce singletons
        setId(id: string | number) {
            this.id = id;
        }

        onNew(callback: () => void) {
            this.onNewCallbacks.register(callback);
        }

        loadNew(): Promise<void> {
            // TODO: implement
            this.onNewCallbacks.run();
            return Promise.resolve();
        }

        load(fileName: string) {
            // TODO: implement
        }

        saveAs(fileName: string) {
            // TODO: implement
        }
    }
}

namespace G {
    // This world object is a convenience for game code and should not be used in engine code
    export var FILE_BANK: SplitTime.file.Bank;

    defer(() => {
        FILE_BANK = new SplitTime.file.Bank("DEFAULT");
    });
}
