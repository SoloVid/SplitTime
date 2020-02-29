namespace SplitTime.conversation {
    export class ConversationPointCompletionCallback implements Callback<void> {
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly breadCrumbs: BreadCrumbs
        ) {}

        call(): void {
            this.conversation.notifyNodeCompletion(this.breadCrumbs)
        }
    }
}