namespace splitTime.file {
    export class Bank {
        private onNewCallbacks: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks()
        private onLoadCallbacks: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks()

        constructor(private readonly id: string | number) {}

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
