namespace splitTime.time {
    interface Host {
        registerTimeAdvanceListener(listener: (delta: game_seconds) => void): void
    }

    /**
     * Wait for a condition to be met, checking every clock tick on host.
     */
    export function waitUntil(host: Host, conditionChecker: () => boolean, timeout: game_seconds): PromiseLike<void> {
        let timePassed = 0
        return new Promise((resolve, reject) => {
            host.registerTimeAdvanceListener(delta => {
                timePassed += delta
                if (conditionChecker()) {
                    resolve()
                    return STOP_CALLBACKS
                }
                if (timeout > 0 && timePassed > timeout) {
                    reject(new Error("Timeout"))
                    return STOP_CALLBACKS
                }
            })
        })
    }
}