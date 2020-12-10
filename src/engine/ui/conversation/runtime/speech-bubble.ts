namespace splitTime.conversation {
    export class SpeechBubble implements Interruptible {
        // can be cut short
        private _effectiveLine: string
        // start with 1 so there is never an empty box
        private _charactersDisplayed: number = 1
        private _timeLastCharacterOut: game_seconds | null = null
        private _isFinished: boolean = false
        private readonly _timeStarted: game_seconds
        private _timePlayedTo: game_seconds
        private _playerInteractHandler:
            | PlayerInteractHandler
            | Function
            | null = null
        private _dismissHandler: Function | null = null
        private _dialogEndHandler:
            | ConversationEndHandler
            | Function
            | null = null

        constructor(
            public readonly conversation: ConversationInstance,
            public readonly speaker: string,
            private _line: string,
            private readonly location: ILevelLocation
        ) {
            for (const conversion of CONVERSIONS) {
                this._line = conversion.apply(this._line)
            }
            this._timeStarted = this._getTime()
            this._timePlayedTo = this._timeStarted
            this._effectiveLine = this._line
        }

        get line(): string {
            return (
                this._effectiveLine +
                this._line.substring(this._effectiveLine.length)
            )
        }

        advanceMethod: AdvanceMethod | null = null
        delay: number = DEFAULT_DELAY_MS
        msPerChar = DEFAULT_MS_PER_CHAR

        getLocation(): ILevelLocation {
            return this.location
        }

        getAdvanceMethod(): AdvanceMethod {
            return this.advanceMethod || AdvanceMethod.DEFAULT
        }

        setAdvanceMethod(advanceMethod: AdvanceMethod | null, delay?: number): void {
            this.advanceMethod = advanceMethod
            this.delay = delay || this.delay
        }

        getDisplayedCurrentLine() {
            return this._effectiveLine.substr(0, this._charactersDisplayed)
        }

        notifyFrameUpdate() {
            let keepGoing = true
            const now = this._getTime()
            while (keepGoing) {
                keepGoing = false
                if (this._charactersDisplayed > this._effectiveLine.length) {
                    if (this.getAdvanceMethod() !== AdvanceMethod.AUTO &&
                        this.getAdvanceMethod() !== AdvanceMethod.HYBRID) {
                        // Do nothing
                    } else if (!this._timeLastCharacterOut) {
                        this._timeLastCharacterOut = this._getTime()
                    } else if (this._getTime() > this._timeLastCharacterOut + this.delay / 1000) {
                        this.advance()
                    }
                } else {
                    const charTime = this._howLongForChar(this.line[this._charactersDisplayed - 1]) / 1000
                    if (this._timePlayedTo + charTime <= now) {
                        this._charactersDisplayed++
                        this._timePlayedTo += charTime
                        keepGoing = true
                    }
                }
            }
        }

        private _howLongForChar(char: string): number {
            if (char === SPACE) {
                return this.msPerChar + EXTRA_MS_PER_SPACE
            } else if (SHORT_BREAK_PUNCTUATION.indexOf(char) >= 0) {
                return this.msPerChar + EXTRA_MS_PER_SHORT_BREAK_PUNCTUATION
            } else if (LONG_BREAK_PUNCTUATION.indexOf(char) >= 0) {
                return this.msPerChar + EXTRA_MS_PER_LONG_BREAK_PUNCTUATION
            }
            return this.msPerChar
        }

        /**
         * TODO: potentially support multiple
         */
        registerPlayerInteractHandler(
            handler: PlayerInteractHandler | Function
        ) {
            this._playerInteractHandler = handler
        }

        registerDismissHandler(handler: Function) {
            this._dismissHandler = handler
        }

        /**
         * TODO: potentially support multiple
         */
        registerDialogEndHandler(handler: ConversationEndHandler | Function) {
            this._dialogEndHandler = handler
        }

        onPlayerInteract() {
            if (typeof this._playerInteractHandler === "function") {
                this._playerInteractHandler()
            } else if (this._playerInteractHandler) {
                this._playerInteractHandler.onPlayerInteract()
            }
            if (
                this.getAdvanceMethod() === AdvanceMethod.INTERACTION ||
                this.getAdvanceMethod() === AdvanceMethod.HYBRID
            ) {
                this.advance()
            }
        }

        onDismiss() {
            if (this._dismissHandler) {
                this._dismissHandler()
            }
        }

        advance() {
            this._timeLastCharacterOut = null
            if (this._charactersDisplayed < this._effectiveLine.length) {
                this._charactersDisplayed = this._effectiveLine.length
            } else {
                this._isFinished = true
                this.onClose()
            }
        }

        onClose() {
            if (this._dialogEndHandler) {
                if (typeof this._dialogEndHandler === "function") {
                    this._dialogEndHandler(this)
                } else if (
                    typeof this._dialogEndHandler.onConversationEnd ===
                    "function"
                ) {
                    this._dialogEndHandler.onConversationEnd()
                } else {
                    splitTime.log.error(
                        "Invalid dialog end handler: ",
                        this._dialogEndHandler
                    )
                }
            }
            this._playerInteractHandler = null
            this._dismissHandler = null
            this._dialogEndHandler = null
        }

        isFinished() {
            return this._isFinished
        }

        interrupt(): void {
            if (
                this._charactersDisplayed >
                this.line.length - 1.5 * DASH.length
            ) {
                this.advance()
            } else if (this._effectiveLine === this.line) {
                this._effectiveLine = this.getDisplayedCurrentLine() + DASH
            }
        }

        _getTime(): game_seconds {
            if (this.location) {
                return this.location
                    .getLevel()
                    .getRegion()
                    .getTime()
            } else {
                return +performance.now() / 1000
            }
        }
    }
}
