namespace splitTime.conversation {
    export type MidConversationCallback = () => (void | ObjectCallbacks<void>)

    export class MidConversationAction {
        private parent: SectionSpec | null = null

        constructor(
            public readonly callback: MidConversationCallback
        ) {}

        setParent(parent: SectionSpec): void {
            assert(this.parent === null, "MidConversationAction parent can only be set once")
            this.parent = parent
        }

        getParent(): SectionSpec {
            assert(this.parent !== null, "MidConversationAction parent should have been set")
            return this.parent!
        }
    }
}
