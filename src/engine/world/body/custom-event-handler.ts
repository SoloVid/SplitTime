namespace splitTime.body {
    export class CustomEventHandler<T> {
        private uid: string

        constructor() {
            this.uid = generateUID()
        }

        registerListener(body: Body, listener: (data: T) => splitTime.CallbackResult): void {
            body.registerEventListener(this.uid, rawData => {
                // The cast here should be safe because the only feeder should be this class
                return listener(rawData as T)
            })
        }

        trigger(body: Body, data: T): void {
            body.triggerEvent(this.uid, data)
        }
    }
}