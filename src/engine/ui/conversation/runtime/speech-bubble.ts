namespace splitTime.conversation {
    /**
     * The displayed state of a line of dialogue.
     */
    export class SpeechBubbleState implements Interruptible {
        private _cutShort: boolean = false
        // can be cut short
        private _effectiveLine: string
        private _pausedAtChar: number = 0
        private _timeLastCharacterOut: game_seconds | null = null
        private _isFinished: boolean = false
        private readonly _timeStarted: game_seconds
        private _timePlayedTo: game_seconds

        constructor(
            private _line: string,
            private readonly timeline: Timeline,
            public readonly speaker?: string,
            private readonly location?: ILevelLocation2
        ) {
            for (const conversion of CONVERSIONS) {
                this._line = conversion.apply(this._line)
            }
            this._timeStarted = this.getTime()
            this._timePlayedTo = this._timeStarted
            this._effectiveLine = this._line
        }

        getLineForMeasurement(): string {
            // This is basically just this._line, but it will have
            //the interrupt dash character in it if applicable.
            return (
                this._effectiveLine +
                this._line.substring(this._effectiveLine.length)
            )
        }

        advanceMethod: AdvanceMethod | null = null
        delay: number = DEFAULT_MS_PER_CHAR * FACTOR_END_OF_LINE
        msPerChar = DEFAULT_MS_PER_CHAR

        getLocation(): ILevelLocation2 | null {
            return this.location ?? null
        }

        getAdvanceMethod(): AdvanceMethod {
            return this.advanceMethod || AdvanceMethod.DEFAULT
        }

        setAdvanceMethod(advanceMethod: AdvanceMethod | null, delay?: number): void {
            this.advanceMethod = advanceMethod
            if (delay !== undefined) {
                this.delay = delay
            }
        }

        getDisplayedCurrentLine() {
            return this._effectiveLine.substr(0,
                Math.min(this._pausedAtChar + 1, this._effectiveLine.length))
        }

        notifyFrameUpdate() {
            let keepGoing = true
            const now = this.getTime()
            while (keepGoing) {
                keepGoing = false
                if (this._pausedAtChar >= this._effectiveLine.length) {
                    // Cut out the time taken by last character anyway
                    let shortenedDelay = this.delay
                    if (!this._cutShort) {
                        shortenedDelay -= howLongForChar(this._effectiveLine[this._effectiveLine.length - 1], this.msPerChar)
                    }
                    if (this.getAdvanceMethod() !== AdvanceMethod.AUTO &&
                        this.getAdvanceMethod() !== AdvanceMethod.HYBRID) {
                        // Do nothing
                    } else if (this._timeLastCharacterOut === null) {
                        this._timeLastCharacterOut = this.getTime()
                    } else if (this.getTime() > this._timeLastCharacterOut + shortenedDelay / 1000) {
                        this.triggerFinish()
                    }
                } else {
                    const charTime = howLongForChar(this._effectiveLine[this._pausedAtChar], this.msPerChar) / 1000
                    if (this._timePlayedTo + charTime <= now) {
                        this._pausedAtChar++
                        this._timePlayedTo += charTime
                        keepGoing = true
                    }
                }
            }
        }

        advance() {
            if (this._pausedAtChar < this._effectiveLine.length) {
                this.jumpToEnd()
            } else {
                this.triggerFinish()
            }
        }

        isFinished() {
            return this._isFinished
        }

        interrupt(): void {
            const minCharLeftForDash = 4
            assert(minCharLeftForDash > DASH.length, "DASH should be shorter than required number of characters")
            const enoughCharLeft = this._pausedAtChar < this._effectiveLine.length - minCharLeftForDash
            const lineNotYetCutShort = this._effectiveLine === this._line
            if (enoughCharLeft && lineNotYetCutShort) {
                this._effectiveLine = this.getDisplayedCurrentLine() + DASH
            }
            this.jumpToEnd()
        }

        private jumpToEnd(): void {
            this._pausedAtChar = this._effectiveLine.length
            if (this._timeLastCharacterOut === null) {
                this._timeLastCharacterOut = this.getTime()
            }
            this._cutShort = true
        }

        private triggerFinish(): void {
            this._isFinished = true
        }

        private getTime(): game_seconds {
            return this.timeline.getTime()
        }
    }
}
