namespace splitTime.conversation {
    export class ConversationPointCompletionCallback implements SimpleCallback<void> {
        constructor(
            private readonly runtime: ConversationPointRuntimeManager,
            private readonly node: ConversationLeafNode
        ) {}

        callBack(): void {
            this.runtime.at(this.node).advance()
        }
    }
}