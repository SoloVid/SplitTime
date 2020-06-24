namespace splitTime {
    /**
     * inst()-able
     */
    export interface Instable<T> {
        inst(): T
    }

    export namespace instanceOf {
        export function Instable(thing: unknown): thing is Instable<unknown> {
            const instable = thing as Instable<unknown>
            return !!thing && typeof instable.inst === "function"
        }
    }
}