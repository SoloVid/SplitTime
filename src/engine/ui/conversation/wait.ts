namespace splitTime.conversation {
    export class Wait {
        constructor(private readonly condition: Condition) {}

        async run(): Promise<outcome_t> {
            // TODO: implement
            log.warn("waitUntil is not yet implemented in conversations")
            return {
                canceled: false,
                interrupted: true
            }
        }
    }
}
