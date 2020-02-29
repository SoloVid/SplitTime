namespace splitTime.body.collisions {
    export function addArrayToSet(
        arr: string[],
        set: { [id: string]: true }
    ): void {
        for (var i = 0; i < arr.length; i++) {
            set[arr[i]] = true
        }
    }
}
