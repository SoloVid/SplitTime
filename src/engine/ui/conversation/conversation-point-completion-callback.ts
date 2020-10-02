namespace splitTime.conversation {
    export class ConversationPointCompletionCallback implements SimpleCallback<void> {
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly breadCrumbs: BreadCrumbs
        ) {}

        callBack(): void {
            this.conversation.notifyNodeCompletion(this.breadCrumbs)
        }
    }
}