namespace splitTime.body {
    export class CustomEventHandler<T> {
        private readonly addOn = new BodyAddOn<RegisterCallbacks>(() => new RegisterCallbacks())

        registerListener(body: Body, listener: (data: T) => CallbackResult): void {
            this.addOn.get(body).register(listener)
        }

        removeListener(body: Body, listener: (data: T) => splitTime.CallbackResult): void {
            if (this.hasListener(body)) {
                this.addOn.get(body).remove(listener)
            }
        }

        trigger(body: Body, data: T): void {
            if (this.hasListener(body)) {
                this.addOn.get(body).run(data)
            }
        }

        hasListener(body: Body): boolean {
            return this.addOn.isSet(body) && this.addOn.get(body).length > 0
        }
    }
}