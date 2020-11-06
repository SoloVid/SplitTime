namespace splitTime.conversation {
    export class ConversationHandlers {
        private isTornDown = false

        private readonly specs: EventListenerSpec[] = []

        constructor(
            private readonly conversation: ConversationInstance,
            private readonly node: ConversationLeafNode,
            private readonly section: SectionSpec,
            private readonly interactEvent: body.CustomEventHandler<void>
        ) {
            for (const speaker of this.section.getSpeakers()) {
                for (const interruptible of this.section.interruptibles) {
                    for (const event of interruptible.events) {
                        this.specs.push({
                            event,
                            body: speaker.body,
                            callback: this.makeCallback(() =>
                                this.conversation.tryInterrupt(event, this.node))
                        })
                    }
                }
                this.specs.push({
                    event: interactEvent,
                    body: speaker.body,
                    callback: this.makeCallback(() => this.conversation.advanceAt(node))
                })
            }
        }

        setUp(): void {
            // FTODO: Try to push this up the chain so that we don't attach and detach so often
            for (const spec of this.specs) {
                spec.event.registerListener(spec.body, spec.callback)
            }
        }

        tearDown(): void {
            this.isTornDown = true
            for (const spec of this.specs) {
                spec.event.removeListener(spec.body, spec.callback)
            }
        }

        private makeCallback(callbackMeat: () => void): () => CallbackResult {
            return () => {
                if (this.isTornDown) {
                    return STOP_CALLBACKS
                }
                callbackMeat()
                return
            }
        }
    }

    interface EventListenerSpec {
        event: body.CustomEventHandler<void>
        body: Body
        callback: () => CallbackResult
    }
}
