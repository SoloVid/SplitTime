namespace splitTime.conversation {
    /**
     * Class responsible for managing the lifecycle of a single conversation point.
     */
    export class ConversationLeafRunner implements Interruptible {
        private readonly handlers: ConversationHandlers
        private lineSpeechBubble: LineSpeechBubble | null = null
        private interruptibleEvent: Interruptible | null = null
        private advanceCallback: (() => void) | null = null

        constructor(
            private readonly runtime: ConversationPointRuntimeManager,
            private readonly node: ConversationLeafNode,
            private readonly helper: HelperInfo
        ) {
            this.handlers = new ConversationHandlers(
                runtime,
                node,
                treeTraveler.getNearestParentSection(node),
                helper.advanceEvent
            )
        // }

        // run(): void {
            this.handlers.setUp()
            if(this.node instanceof Line) {
                const lineSpeechBubble = this.makeLineSpeechBubble(this.node)
                this.lineSpeechBubble = lineSpeechBubble
                this.interruptibleEvent = lineSpeechBubble.speechBubble
                this.advanceCallback = () => lineSpeechBubble.speechBubble.advance()
            } else if(this.node instanceof MidConversationAction) {
                this.interruptibleEvent = this.launchEvent(this.node)
            } else {
                throw new Error("Conversation node of unexpected type when running")
            }
        }

        getLineSpeechBubble(): LineSpeechBubble | null {
            return this.lineSpeechBubble
        }

        interrupt(): void {
            if (this.interruptibleEvent !== null) {
                this.interruptibleEvent.interrupt()
            }
        }

        advance(): void {
            if (this.advanceCallback !== null) {
                this.advanceCallback()
            }
        }

        private makeLineSpeechBubble(line: Line): LineSpeechBubble {
            const speechBubble = new SpeechBubbleState(
                line.speaker.name,
                line.text,
                line.speaker.speechBox
            )
            return new LineSpeechBubble(line, speechBubble)
        }

        private launchEvent(event: MidConversationAction): Interruptible | null {
            const callback = new ConversationPointCompletionCallback(this.runtime, event)
            const eventReturn = event.run()
            if(eventReturn instanceof ObjectCallbacks) {
                eventReturn.register(callback)
            } else {
                callback.callBack()
            }
            if(instanceOf.Interruptible(eventReturn)) {
                return eventReturn
            }
            return null
        }
    }
}
