namespace splitTime.conversation {
    export class MidConversationAction {
        private parent: SectionSpec | null = null
        private readonly midEventAction: time.MidEventAction

        constructor(
            callback: time.MidEventCallback
        ) {
            this.midEventAction = new time.MidEventAction(callback)
        }

        run() {
            return this.midEventAction.run()
        }

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
