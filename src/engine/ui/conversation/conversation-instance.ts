namespace splitTime.conversation {
    type Action = Line | MidConversationAction
    type Part = Action | SectionSpec | LineSequence | InterruptibleSpec

    type Current = { action: Action, breadCrumbs: BreadCrumbs, interruptibleEvent: Interruptible | null, handlers: ConversationHandlers }

    export class ConversationInstance {
        public readonly clique: Clique = new Clique()
        private current: Current | null = null

        constructor(
            private readonly topLevelSection: SectionSpec,
            private readonly helper: RunnerHelper
        ) {}

        start(): void {
            this.enactBreadCrumbs(new BreadCrumbs(this.topLevelSection))
        }

        private isCurrentNode(nodeId: BreadCrumbs): boolean {
            return this.current !== null && this.current.breadCrumbs.equals(nodeId)
        }

        notifyNodeCompletion(nodeId: BreadCrumbs): void {
            if(this.isCurrentNode(nodeId)) {
                this.advance()
            }
        }

        advance(): void {
            assert(this.current !== null, "Conversation bread crumbs should not be null when advancing")
            const nextBreadCrumbs = this.current!.breadCrumbs.getNext()
            this.enactBreadCrumbs(nextBreadCrumbs)
        }

        private enactBreadCrumbs(breadCrumbs: BreadCrumbs | null): void {
            if(!!this.current) {
                this.current.handlers.tearDown()
            }
            if(breadCrumbs === null) {
                // Conversation is done
                this.current = null
                return
            }
            const action = breadCrumbs.getActionItem()
            const section = action.getParent()
            const newCurrent: Current = {
                action: action,
                breadCrumbs: breadCrumbs,
                interruptibleEvent: null,
                handlers: new ConversationHandlers(this, breadCrumbs, section, this.helper)
            }
            this.current = newCurrent
            newCurrent.handlers.setUp()
            if(action instanceof Line) {
                const lineRunner = this.launchLine(action, breadCrumbs)
                newCurrent.interruptibleEvent = lineRunner
                newCurrent.handlers.onInteract = () => lineRunner.onInteract()
            } else if(action instanceof MidConversationAction) {
                newCurrent.interruptibleEvent = this.launchEvent(action, breadCrumbs)
            } else {
                throw new Error("Conversation bread crumb of unexpected type when advancing")
            }
        }

        tryCancel(nodeId: BreadCrumbs): boolean {
            if(this.current === null || !this.isCurrentNode(nodeId)) {
                return false
            }
            if(!this.isCancelable(this.current.action)) {
                return false
            }
            const cancelBreadCrumbs = this.current.breadCrumbs.getNextCanceled()
            this.enactBreadCrumbs(cancelBreadCrumbs)
            return true
        }

        private isCancelable(part: Part): boolean {
            if(part instanceof SectionSpec && part.cancelSection !== null) {
                return true
            }
            const parent = part.getParent()
            if(parent === null) {
                return false
            }
            return this.isCancelable(parent)
        }

        tryInterrupt(nodeId: BreadCrumbs): boolean {
            if(this.current === null || !this.isCurrentNode(nodeId)) {
                return false
            }
            const interruptible = this.getInterruptible(this.current.action)
            if(interruptible) {
                this.interrupt(nodeId, interruptible)
                return true
            }
            return false
        }

        private getInterruptible(part: Part): InterruptibleSpec | null {
            if(part instanceof SectionSpec) {
                for(const interruptible of part.interruptibles) {
                    if(interruptible.conditionMet) {
                        return interruptible
                    }
                }
            }
            const parent = part.getParent()
            if(parent === null) {
                return null
            }
            return this.getInterruptible(parent)
        }

        interrupt(nodeId: BreadCrumbs, interruptible: InterruptibleSpec): void {
            assert(this.isCurrentNode(nodeId), "Interruptions must happen on current node")

            if(this.current?.interruptibleEvent) {
                this.current.interruptibleEvent.interrupt()
            }
            this.enactBreadCrumbs(nodeId.getNextInterrupted(interruptible))
        }

        private launchLine(line: Line, nodeId: BreadCrumbs): LineRunner {
            const lineRunner = new LineRunner(this, nodeId, line, this.helper)
            lineRunner.start()
            return lineRunner
        }

        private launchEvent(event: MidConversationAction, nodeId: BreadCrumbs): Interruptible | null {
            const callback = new ConversationPointCompletionCallback(this, nodeId)
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