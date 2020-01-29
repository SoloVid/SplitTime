namespace SplitTime.time {
    type event_callback_t = (param?: file.jsonable) => void;

    export class EventSpec {
        constructor(public readonly id: string, public readonly callback: event_callback_t) {

        }
    }
}