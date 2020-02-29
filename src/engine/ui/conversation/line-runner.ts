namespace splitTime.conversation {
    export class LineRunner implements Interruptible {
        private readonly dialog: SpeechBubble
        private readonly speakers: readonly Speaker[]
        private started: boolean = false
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly nodeId: BreadCrumbs,
            private readonly line: Line,
            private readonly helper: RunnerHelper
        ) {
            this.dialog = new SpeechBubble(
                conversation.clique,
                this.line.speaker.name,
                this.line.text,
                this.line.speaker.speechBox
            )
            this.speakers = line.getParent().getSpeakers()
        }

        private registerHandlers() {
            this.dialog.registerPlayerInteractHandler(() => this.conversation.tryInterrupt(this.nodeId))
            this.dialog.registerDismissHandler(() => this.conversation.tryCancel(this.nodeId) && this.stop())
            this.dialog.registerDialogEndHandler(() => this.stop())
        }

        start(): void {
            if (this.started) {
                throw new Error("LineRunner already started!")
            }
            this.started = true
            // FTODO: make this a bit more object oriented
            this.registerHandlers()
            this.dialog.clique.speakers = this.speakers
            this.helper.secretary.submit(this.dialog)
        }

        stop(): void {
            this.helper.secretary.remove(this.dialog)
            this.conversation.notifyNodeCompletion(this.nodeId)
        }

        interrupt(): void {
            this.dialog.interrupt()
        }
    }
}
