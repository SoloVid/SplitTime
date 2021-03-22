namespace splitTime.conversation {
    export class ConversationSpecBuilder {
        constructor(
            private readonly setup: SetupFunc,
            private readonly options?: Partial<Options>
        ) {}

        build(): ConversationSpec {
            const builder = new ConversationDslBuilder(this.options)
            this.setup(builder)
            return builder.build()
        }
    }
}