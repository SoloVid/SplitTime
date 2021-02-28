namespace splitTime.conversation {
    interface Current {
        // action: ConversationLeafNode
        // section: SectionSpec
        runner: ConversationLeafRunner
    }

    export interface IConversationRuntimeManager {
        // isFinished(): boolean
        interrupt(event: body.CustomEventHandler<void>): void
        pullOut(body: Body): void
        advance(): void
    }

    export interface ConversationPointRuntimeManager {
        at(node: ConversationLeafNode): IConversationRuntimeManager
    }

    const nopConversationRuntimeManager: IConversationRuntimeManager = {
        interrupt() {},
        pullOut() {},
        advance() {},
    }

    /**
     * Class responsible for managing the lifecycle of a ConversationInstance.
     */
    export class ConversationRuntimeManager implements IConversationRuntimeManager, ConversationPointRuntimeManager {
        /** Stuff for our current conversation point. */
        private current: Current | null = null
        /** Speech bubble displaying. May be a line behind our conversation pointer. */
        private activeSpeechBubble: SpeechBubbleState | null = null

        constructor(
            public readonly conversation: ConversationInstance,
            private readonly helper: HelperInfo
        ) {
            this.updateCurrent()
        }

        at(node: ConversationLeafNode): IConversationRuntimeManager {
            if (this.conversation.isCurrentNode(node)) {
                return this
            }
            splitTime.log.warn("Operating on stale conversation point; TODO: Is this a bad thing?")
            return nopConversationRuntimeManager
        }

        isFinished(): boolean {
            return this.conversation.getCurrentLeaf() === null
        }

        getSpeechBubble(): SpeechBubbleState | null {
            return this.activeSpeechBubble
            // if (this.current === null) {
            //     return null
            // }
            // return this.current.runner.getSpeechBubble()
        }
        
        private checkForCancellations(): void {
            // TODO: implement
        }

        interrupt(event: body.CustomEventHandler<void>): void {
            if (this.activeSpeechBubble !== null) {
                this.activeSpeechBubble.interrupt()
            }
            const interrupted = this.conversation.tryInterrupt(event)
            this.maybeUpdateCurrent(interrupted)
        }

        pullOut(body: Body): void {
            if (this.activeSpeechBubble !== null) {
                this.activeSpeechBubble.interrupt()
            }
            const canceled = this.conversation.tryCancel(body)
            this.maybeUpdateCurrent(canceled)
        }

        advance(): void {
            if (this.activeSpeechBubble !== null) {
                this.activeSpeechBubble.advance()
            }
            this.conversation.advanceToNext()
            this.updateCurrent()
        }

        private maybeUpdateCurrent(indication: boolean): void {
            if (indication) {
                this.updateCurrent()
            } else if (this.conversation.getCurrentLeaf() === null) {
                this.current = null
            }
        }

        private updateCurrent(): void {
            const leaf = this.conversation.getCurrentLeaf()
            if (leaf === null) {
                this.current = null
            } else {
                this.current = {
                    // action: leaf,
                    runner: new ConversationLeafRunner(this, leaf, this.helper)
                }
                if (this.activeSpeechBubble === null) {
                    this.activeSpeechBubble = this.current.runner.getSpeechBubble()
                }
            }
        }

        notifyFrameUpdate(): void {
            this.checkForCancellations()
            if (this.activeSpeechBubble !== null) {
                this.activeSpeechBubble.notifyFrameUpdate()
                if (this.activeSpeechBubble.isFinished()) {
                    this.handleSpeechBubbleFinished()
                }
            }
        }

        private handleSpeechBubbleFinished(): void {
            if (this.current === null) {
                this.activeSpeechBubble = null
                return
            }
            let currentSpeechBubble = this.current.runner.getSpeechBubble()
            if (currentSpeechBubble === this.activeSpeechBubble) {
                this.advance()
                currentSpeechBubble = this.current?.runner.getSpeechBubble() || null
            }
            this.activeSpeechBubble = currentSpeechBubble
        }

    }
}
