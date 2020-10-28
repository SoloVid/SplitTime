// I couldn't figure out how to import Vue's types
declare class Vue {
    constructor(object: object)
    static component(name: string, options: object): void
    static set(object: object, key: string, value: unknown): void
}

const MaybeVue = {
    /**
     * Assign value to object[key], but make sure Vue knows about it if Vue is available
     */
    set<T>(object: { [key: string]: T }, key: string, value: T): void {
        if (Vue !== undefined && "__ob__" in object) {
            Vue.set(object, key, value)
        } else {
            object[key] = value
        }
    }
}
