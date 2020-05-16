namespace splitTime.conversation {
    export class ConversationPointCompletionCallback implements Callback<void> {
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly breadCrumbs: BreadCrumbs
        ) {}

        callBack(): void {
            this.conversation.notifyNodeCompletion(this.breadCrumbs)
        }
    }
}