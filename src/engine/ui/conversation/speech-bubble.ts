namespace splitTime.conversation {
    export class SpeechBubble implements Interruptible {
        // can be cut short
        private _effectiveLine: string
        private _charactersDisplayed: number
        private _startDelay: number | null = null
        private _isFinished: boolean
        private _location: ILevelLocation
        private _timeline: splitTime.Timeline | null = null
        private _lastStepMs: number = 0
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
            public readonly clique: Clique,
            public readonly speaker: string,
            private _line: string,
            location: ILevelLocation
        ) {
            for (const conversion of CONVERSIONS) {
                this._line = conversion.apply(this._line)
            }
            this._location = location
            this._lastStepMs = 0
            this._effectiveLine = this._line
            this._charactersDisplayed = 0
            this._startDelay = null
            this._isFinished = false
        }

        get line(): string {
            return (
                this._effectiveLine +
                this._line.substring(this._effectiveLine.length)
            )
        }

        _advanceMethod: string | null = null
        _delay: number = DEFAULT_DELAY_MS
        _msPerChar = DEFAULT_MS_PER_CHAR

        getLocation(): ILevelLocation {
            return this._location
        }
        setLocation(location: ILevelLocation) {
            this._location = location
            this._lastStepMs = 0
        }

        getAdvanceMethod() {
            return this._advanceMethod || AdvanceMethod.DEFAULT
        }

        setAdvanceMethod(advanceMethod: string | null, delay?: number) {
            this._advanceMethod = advanceMethod
            this._delay = delay || this._delay
        }

        getDisplayedCurrentLine() {
            return this._effectiveLine.substr(0, this._charactersDisplayed)
        }

        notifyFrameUpdate() {
            const msSinceLastStep = this._getTimeMs() - this._lastStepMs
            if (this._charactersDisplayed === 0) {
                this.step()
            } else if (
                msSinceLastStep >
                this._howLongForChar(this.line[this._charactersDisplayed - 1])
            ) {
                this.step()
            }
        }

        private _howLongForChar(char: string): number {
            if (char === SPACE) {
                return this._msPerChar + EXTRA_MS_PER_SPACE
            } else if (SHORT_BREAK_PUNCTUATION.indexOf(char) >= 0) {
                return this._msPerChar + EXTRA_MS_PER_SHORT_BREAK_PUNCTUATION
            } else if (LONG_BREAK_PUNCTUATION.indexOf(char) >= 0) {
                return this._msPerChar + EXTRA_MS_PER_LONG_BREAK_PUNCTUATION
            }
            return this._msPerChar
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
            this._startDelay = null
            if (this._charactersDisplayed < this._effectiveLine.length) {
                this._charactersDisplayed = this._effectiveLine.length
            } else {
                this._isFinished = true
                this.onClose()
            }
        }

        /**
         * Move forward one frame relative to the dialog speed
         */
        step() {
            this._lastStepMs = this._getTimeMs()
            if (this._charactersDisplayed < this._effectiveLine.length) {
                this._charactersDisplayed++
            } else if (
                this.getAdvanceMethod() === AdvanceMethod.AUTO ||
                this.getAdvanceMethod() === AdvanceMethod.HYBRID
            ) {
                if (!this._startDelay) {
                    this._startDelay = this._getTimeMs()
                } else if (this._getTimeMs() > this._startDelay + this._delay) {
                    this.advance()
                }
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
                    splitTime.Logger.error(
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

        _getTimeMs() {
            if (this._location) {
                return this._location
                    .getLevel()
                    .getRegion()
                    .getTimeMs()
            } else {
                return +new Date()
            }
        }
    }
}
