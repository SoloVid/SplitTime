namespace splitTime {
    export function delay(seconds: number): Promise<void> {
        var promise = new Promise<void>(resolve => {
            setTimeout(function() {
                resolve()
            }, seconds * 1000)
        })
        return promise
    }
}
