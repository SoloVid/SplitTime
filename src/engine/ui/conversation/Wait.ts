namespace SplitTime.conversation {
    export class Wait implements Runnable {
        constructor(
            private readonly condition: condition_t
        ) {

        }

        async run(): Promise<outcome_t> {
            // TODO: implement
            Logger.warn("waitUntil is not yet implemented in conversations");
            return {
                canceled: false,
                interrupted: true
            };
        }
    }
}