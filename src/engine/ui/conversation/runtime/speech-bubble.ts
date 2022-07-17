namespace splitTime.conversation {
    /**
     * The displayed state of a line of dialogue.
     */
    export class SpeechBubbleState implements Interruptible {
        private _cutShort: boolean = false
        // can be cut short
        private _effectiveParts: TextPart[]
        private _pausedAtChar: number = 0
        private _timeLastCharacterOut: game_seconds | null = null
        private _isFinished: boolean = false
        private readonly _timeStarted: game_seconds
        private _timePlayedTo: game_seconds

        constructor(
            private _parts: readonly TextPart[],
            private readonly timeline: Timeline,
            public readonly speaker?: string,
            private readonly location?: ILevelLocation2
        ) {
            for (const conversion of CONVERSIONS) {
                for (const p of this._parts) {
                    p.text = conversion.apply(p.text)
                }
            }
            this._timeStarted = this.getTime()
            this._timePlayedTo = this._timeStarted
            this._effectiveParts = [...this._parts]
        }

        getPartsForMeasurement(): readonly Readonly<TextPart>[] {
            return this._effectiveParts
            // This is basically just this._parts, but it will have
            //the interrupt dash character in it if applicable.
            // return (
            //     this._effectiveLine +
            //     this._line.substring(this.getEffectiveCharCount())
            // )
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

        getDisplayedCurrentParts(): readonly Readonly<TextPart>[] {
            const parts: TextPart[] = []
            let charSoFar = 0
            for (const p of this._effectiveParts) {
                if (charSoFar + p.text.length <= this._pausedAtChar + 1) {
                    parts.push(p)
                    charSoFar += p.text.length
                } else {
                    const partText = p.text.substring(0, this._pausedAtChar + 1 - charSoFar)
                    parts.push({...p, text: partText})
                    break;
                }
            }
            return parts
        }

        getDisplayedCharCount(): number {
            return this.getDisplayedCurrentParts().reduce((sum, p) => sum + p.text.length, 0)
        }

        notifyFrameUpdate() {
            let keepGoing = true
            const now = this.getTime()
            while (keepGoing) {
                keepGoing = false
                if (this._pausedAtChar >= this.getEffectiveCharCount()) {
                    // Cut out the time taken by last character anyway
                    let shortenedDelay = this.delay
                    if (!this._cutShort) {
                        shortenedDelay -= howLongForChar(this.listToString(this._effectiveParts)[this.getEffectiveCharCount() - 1], this.msPerChar)
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
                    const charTime = howLongForChar(this.listToString(this._effectiveParts)[this._pausedAtChar], this.msPerChar) / 1000
                    if (this._timePlayedTo + charTime <= now) {
                        this._pausedAtChar++
                        this._timePlayedTo += charTime
                        keepGoing = true
                    }
                }
            }
        }

        advance() {
            if (this._pausedAtChar < this.getEffectiveCharCount()) {
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
            const enoughCharLeft = this._pausedAtChar < this.getEffectiveCharCount() - minCharLeftForDash
            const lineNotYetCutShort = this.listToString(this._effectiveParts) === this.listToString(this._parts)
            if (enoughCharLeft && lineNotYetCutShort) {
                this._effectiveParts = [...this.getDisplayedCurrentParts(), {text:DASH}]
            }
            this.jumpToEnd()
        }

        private jumpToEnd(): void {
            this._pausedAtChar = this.getEffectiveCharCount()
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

        private getEffectiveCharCount(): number {
            return this._effectiveParts.reduce((sum, p) => sum + p.text.length, 0)
        }

        private listToString(parts: readonly Readonly<TextPart>[]): string {
            return parts.map(p => p.text).join("")
        }
    }
}
