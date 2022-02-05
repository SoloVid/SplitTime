import { BodyAddOn } from "./body-add-on";
import { RegisterCallbacks, CallbackResult } from "../../splitTime";
import * as splitTime from "../../splitTime";
export class CustomEventHandler<T> {
    private readonly addOn = new BodyAddOn<RegisterCallbacks>(() => new RegisterCallbacks());
    registerListener(body: splitTime.Body, listener: (data: T) => CallbackResult): void {
        this.addOn.get(body).register(listener);
    }
    removeListener(body: splitTime.Body, listener: (data: T) => CallbackResult): void {
        if (this.hasListener(body)) {
            this.addOn.get(body).remove(listener);
        }
    }
    trigger(body: splitTime.Body, data: T): void {
        if (this.hasListener(body)) {
            this.addOn.get(body).run(data);
        }
    }
    hasListener(body: splitTime.Body): boolean {
        return this.addOn.isSet(body) && this.addOn.get(body).length > 0;
    }
}
