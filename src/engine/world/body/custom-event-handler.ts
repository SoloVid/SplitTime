namespace splitTime.body {
    export class CustomEventHandler<T> {
        private uid: string

        constructor() {
            this.uid = generateUID()
        }

        registerListener(body: Body, listener: (data: T) => CallbackResult): void {
            // The cast here should be safe because the only feeder should be this class
            body.registerEventListener(this.uid, listener as (data: unknown) => CallbackResult)
        }

        removeListener(body: Body, listener: (data: T) => splitTime.CallbackResult): void {
            // The cast here should be safe because the only feeder should be this class
            body.removeEventListener(this.uid, listener as (data: unknown) => CallbackResult)
        }

        trigger(body: Body, data: T): void {
            body.triggerEvent(this.uid, data)
        }

        hasListener(body: Body): boolean {
            return body.hasEventListener(this.uid)
        }
    }
}