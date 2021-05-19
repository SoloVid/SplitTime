namespace splitTime.body {
    export class BodyAddOn<T> {
        private readonly uid: string

        constructor(private readonly defaultValue: Indirect<T>) {
            this.uid = generateUID()
        }

        isSet(body: Body): boolean {
            return body.hasAddOn(this.uid)
        }

        get(body: Body): T {
            if (!this.isSet(body)) {
                this.set(body, redirect(this.defaultValue))
            }
            // Cast here should be safe because the only feeder for this ID should be this class.
            return body.getAddOn(this.uid) as T
        }

        set(body: Body, data: T): void {
            body.setAddOn(this.uid, data)
        }
    }
}