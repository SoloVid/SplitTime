namespace SplitTime.time {
    export class EventSpec<T extends file.jsonable = never> {
        constructor(id: string, callback: () => void);
        constructor(id: string, callback: (param?: T) => void);
        constructor(public readonly id: string, public readonly callback: (param?: T) => void) {
        }

        inst(argument?: T): EventInstance<T> {
            return new EventInstance(this, argument);
        }
    }
}