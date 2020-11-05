namespace splitTime.conversation {
    export class ConversationPointCompletionCallback implements SimpleCallback<void> {
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly node: ConversationLeafNode
        ) {}

        callBack(): void {
            this.conversation.notifyNodeCompletion(this.node)
        }
    }
}