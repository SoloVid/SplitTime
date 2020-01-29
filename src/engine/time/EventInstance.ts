namespace SplitTime.time {
    export class EventInstance<T extends file.jsonable> {
        constructor(public readonly spec: EventSpec<T>, private readonly argument?: T) {

        }

        run() {
            this.spec.callback(this.argument);
        }
    }
}