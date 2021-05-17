namespace splitTime.conversation {
    export class ConversationLiaison {
        constructor(
            private readonly specManager: ConversationSpecManager,
            private readonly secretary: Secretary
        ) {}

        register(id: string, setup: SetupFunc, options?: Partial<Options>): time.EventSpec<void> {
            return this.specManager.register(id, setup, options)
        }

        makeSpeaker(body: Body): Speaker {
            return new Speaker(this.secretary, body)
        }

        tryAdvance(): true | void {
            const engagedConversation = this.secretary.getEngagedConversation()
            if (engagedConversation !== null) {
                this.secretary.advance(engagedConversation)
                return true
            }
        }
    }
}