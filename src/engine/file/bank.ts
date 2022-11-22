import { RegisterCallbacks } from "engine/utils/register-callbacks";

export class Bank {
    private onNewCallbacks: RegisterCallbacks = new RegisterCallbacks();
    private onLoadCallbacks: RegisterCallbacks = new RegisterCallbacks();
    constructor(private readonly id: string | number) { }
    /**
     * Register a callback to be run when a new file is create before onLoad callbacks run
     */
    onNew(callback: () => void) {
        this.onNewCallbacks.register(callback);
    }
    /**
     * Register a callback to be run after a file is loaded (including a new file)
     */
    onLoad(callback: () => void) {
        this.onLoadCallbacks.register(callback);
    }
    loadNew(): Promise<void> {
        // TODO: implement
        this.onNewCallbacks.run();
        this.onLoadCallbacks.run();
        return Promise.resolve();
    }
    load(fileName: string) {
        // TODO: implement
    }
    saveAs(fileName: string) {
        // TODO: implement
    }
}
