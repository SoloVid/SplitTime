namespace splitTime.body.collisions {
    export function addArrayToSet(
        arr: string[],
        set: { [id: string]: true }
    ): void {
        for (const item of arr) {
            set[item] = true
        }
    }
}
