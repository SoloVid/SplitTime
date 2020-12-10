namespace splitTime.conversation {
    export class LineRunner implements Interruptible {
        private readonly dialog: SpeechBubble
        private readonly speakers: readonly Speaker[]
        private started: boolean = false
        constructor(
            private readonly conversation: ConversationInstance,
            private readonly node: ConversationLeafNode,
            private readonly line: Line,
            private readonly helper: RunnerHelper
        ) {
            this.dialog = new SpeechBubble(
                conversation,
                this.line.speaker.name,
                this.line.text,
                this.line.speaker.speechBox
            )
            this.speakers = line.getParent().getParent().getSpeakers()
        }

        advance(): void {
            this.dialog.advance()
        }

        private registerHandlers() {
            this.dialog.registerPlayerInteractHandler(() => this.advance())
            this.dialog.registerDismissHandler(() => {
                const playerBody = this.conversation.helper.secretary.perspective.playerBody
                // Only cancel the conversation if the player is involved.
                // FTODO: Improve conversation cancellation system
                if (this.speakers.some(s => s.body === playerBody)) {
                    this.conversation.tryCancel(this.node) && this.stop()
                }
            })
            this.dialog.registerDialogEndHandler(() => this.stop())
        }

        start(): void {
            if (this.started) {
                throw new Error("LineRunner already started!")
            }
            this.started = true
            // FTODO: make this a bit more object oriented
            this.registerHandlers()
            this.helper.secretary.submit(this.dialog)
        }

        stop(): void {
            this.helper.secretary.remove(this.dialog)
            this.conversation.notifyNodeCompletion(this.node)
        }

        interrupt(): void {
            this.dialog.interrupt()
        }
    }
}
