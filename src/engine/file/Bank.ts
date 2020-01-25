namespace SplitTime.file {
    export class Bank {
        private onNewCallbacks: SLVD.RegisterCallbacks = new SLVD.RegisterCallbacks();

        constructor(private readonly id: string | number) {

        }
    
        onNew(callback: () => void) {
            this.onNewCallbacks.register(callback);
        };
    
        loadNew(): Promise<void> {
            this.onNewCallbacks.run();
            return Promise.resolve();
        };
    
        load(fileName: string) {
            // TODO: implement
        };
    
        saveAs(fileName: string) {
            // TODO: implement
        };    
    }
}
