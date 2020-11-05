namespace splitTime.conversation {
    export type ConversationLeafNode = Line | MidConversationAction
    export type ConversationInnerNode = SectionSpec | LineSequence | ConversationSpec
    type Part = ConversationLeafNode | SectionSpec | LineSequence | InterruptibleSpec

    type Current = { action: ConversationLeafNode, interruptibleEvent: Interruptible | null, handlers: ConversationHandlers }

    export class ConversationInstance {
        public readonly clique: Clique = new Clique()
        private current: Current | null = null
        private readonly treeTraveler: TreeTraveler = new TreeTraveler()

        constructor(
            private readonly spec: ConversationSpec,
            private readonly helper: RunnerHelper
        ) {}

        start(): void {
            const first = this.treeTraveler.getFirst(this.spec.topLevelSection)
            this.goToNode(first)
        }

        private isCurrentNode(node: ConversationLeafNode): boolean {
            return this.current !== null && this.current.action === node
        }

        notifyNodeCompletion(node: ConversationLeafNode): void {
            if(this.isCurrentNode(node)) {
                this.advance()
            }
        }

        advance(): void {
            assert(this.current !== null, "Conversation bread crumbs should not be null when advancing")
            const nextAction = this.treeTraveler.getNextAfter(this.current.action)
            this.goToNode(nextAction)
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
            const section = action.getParent()
            const newCurrent: Current = {
                action,
                interruptibleEvent: null,
                handlers: new ConversationHandlers(this, action, section, this.helper)
            }
            this.current = newCurrent
            newCurrent.handlers.setUp()
            if(action instanceof Line) {
                const lineRunner = this.launchLine(action)
                newCurrent.interruptibleEvent = lineRunner
                newCurrent.handlers.onInteract = () => lineRunner.onInteract()
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

        tryInterrupt(type: string, node: ConversationLeafNode): boolean {
            if(this.current === null || !this.isCurrentNode(node)) {
                return false
            }
            const nextPerInterrupt = this.treeTraveler.getInterruptedFrom(type, node)
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