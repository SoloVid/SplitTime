namespace splitTime.file {
    export class Bank {
        private onNewCallbacks: SLVD.RegisterCallbacks = new SLVD.RegisterCallbacks()
        private onLoadCallbacks: SLVD.RegisterCallbacks = new SLVD.RegisterCallbacks()

        constructor(private id: string | number) {}

        // This function is only here because of the singleton pattern.
        // FTODO: consider removing to reduce singletons
        setId(id: string | number) {
            this.id = id
        }

        /**
         * Register a callback to be run when a new file is create before onLoad callbacks run
         */
        onNew(callback: () => void) {
            this.onNewCallbacks.register(callback)
        }

        /**
         * Register a callback to be run after a file is loaded (including a new file)
         */
        onLoad(callback: () => void) {
            this.onLoadCallbacks.register(callback)
        }

        loadNew(): Promise<void> {
            // TODO: implement
            this.onNewCallbacks.run()
            this.onLoadCallbacks.run()
            return Promise.resolve()
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
    // This object is a convenience for game code and should not be used in engine code
    export var FILE_BANK: splitTime.file.Bank

    defer(() => {
        FILE_BANK = new splitTime.file.Bank("DEFAULT")
    })
}
