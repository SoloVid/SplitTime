namespace splitTime.conversation {
    interface Current {
        action: ConversationLeafNode
        section: SectionSpec
        interruptibleEvent: Interruptible | null
        handlers: ConversationHandlers
        advanceCallback: (() => void) | null
    }

    export class ConversationInstance {
        private current: Current | null = null
        private readonly treeTraveler: TreeTraveler = new TreeTraveler()

        constructor(
            private readonly spec: ConversationSpec,
            // FTODO: make private again
            public readonly helper: RunnerHelper
        ) {}

        start(): void {
            const first = this.treeTraveler.getFirst(this.spec.topLevelSection)
            this.goToNode(first)
        }

        getCurrentSpeakers(): readonly Speaker[] {
            if (this.current === null) {
                return []
            }
            return this.current.section.getSpeakers()
        }

        private isCurrentNode(node: ConversationLeafNode): boolean {
            return this.current !== null && this.current.action === node
        }

        checkForCancellations(): void {
            // TODO: put something in here to cancel conversations as necessary
        }

        notifyNodeCompletion(node: ConversationLeafNode): void {
            if(this.isCurrentNode(node)) {
                assert(this.current !== null, "Conversation current should not be null when advancing")
                const nextAction = this.treeTraveler.getNextAfter(this.current.action)
                this.goToNode(nextAction)
            }
        }

        advanceAt(node: ConversationLeafNode): void {
            if(this.isCurrentNode(node)) {
                this.current?.advanceCallback?.()
            }
        }

        private goToNode(action: ConversationLeafNode | null): void {
            if(!!this.current) {
                this.current.handlers.tearDown()
            }
            if(action === null) {
                // Conversation is done
                this.current = null
                return
            }
            const section = this.treeTraveler.getNearestParentSection(action)
            const newCurrent: Current = {
                action,
                section,
                interruptibleEvent: null,
                handlers: new ConversationHandlers(this, action, section, this.helper.advanceEvent),
                advanceCallback: null
            }
            this.current = newCurrent
            newCurrent.handlers.setUp()
            if(action instanceof Line) {
                const lineRunner = this.launchLine(action)
                newCurrent.interruptibleEvent = lineRunner
                newCurrent.advanceCallback = () => lineRunner.advance()
            } else if(action instanceof MidConversationAction) {
                newCurrent.interruptibleEvent = this.launchEvent(action)
            } else {
                throw new Error("Conversation bread crumb of unexpected type when advancing")
            }
        }

        tryCancel(node: ConversationLeafNode): boolean {
            if(this.current === null || !this.isCurrentNode(node)) {
                return false
            }
            const cancelNext = this.treeTraveler.getCanceledFrom(node)
            // FTODO: Do I ever want to block this on null?
            this.goToNode(cancelNext)
            return true
        }

        tryInterrupt(event: body.CustomEventHandler<void>, node: ConversationLeafNode): boolean {
            if(this.current === null || !this.isCurrentNode(node)) {
                return false
            }
            const nextPerInterrupt = this.treeTraveler.getInterruptedFrom(event, node)
            if (nextPerInterrupt === null) {
                return false
            }
            if(this.current?.interruptibleEvent) {
                this.current.interruptibleEvent.interrupt()
            }
            this.goToNode(nextPerInterrupt)
            return true
        }

        private launchLine(line: Line): LineRunner {
            const lineRunner = new LineRunner(this, line, line, this.helper)
            lineRunner.start()
            return lineRunner
        }

        private launchEvent(event: MidConversationAction): Interruptible | null {
            const callback = new ConversationPointCompletionCallback(this, event)
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