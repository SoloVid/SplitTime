import { Indirect, generateUID, redirect } from "../../splitTime";
import * as splitTime from "../../splitTime";
export class BodyAddOn<T> {
    private readonly uid: string;
    constructor(private readonly defaultValue: Indirect<T>) {
        this.uid = generateUID();
    }
    isSet(body: splitTime.Body): boolean {
        return body.hasAddOn(this.uid);
    }
    get(body: splitTime.Body): T {
        if (!this.isSet(body)) {
            this.set(body, redirect(this.defaultValue));
        }
        // Cast here should be safe because the only feeder for this ID should be this class.
        return body.getAddOn(this.uid) as T;
    }
    set(body: splitTime.Body, data: T): void {
        body.setAddOn(this.uid, data);
    }
}
