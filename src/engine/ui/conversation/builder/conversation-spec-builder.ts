namespace splitTime.conversation {
    export class ConversationSpecBuilder {
        constructor(
            private readonly setup: SetupFunc
        ) {}

        build(): ConversationSpec {
            const builder = new ConversationDslBuilder()
            this.setup(builder)
            return builder.build()
        }
    }
}