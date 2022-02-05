namespace splitTime {
    /**
     * inst()-able
     */
    export interface Instable<T> {
        inst(): T
    }
}
namespace splitTime {
    export function instanceOfInstable(thing: unknown): thing is Instable<unknown> {
        const instable = thing as Instable<unknown>
        return !!thing && typeof instable.inst === "function"
    }
}
