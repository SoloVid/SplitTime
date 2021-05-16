namespace splitTime.conversation {
    export type Condition = true | (() => boolean)

    export interface DSL {
        /** Explicitly register a speaker as part of this conversation (section) */
        listen(speaker: Speaker): void
        say(speaker: Speaker, line: string, options?: Partial<Options>): void
        section(sectionSetup: () => void, options?: Partial<Options>): SectionChain
        do(action: time.MidEventCallback): void
        // waitUntil(condition: Condition): void
    }

    export interface SectionChain {
        /**
         * The modified section can be canceled when a speaker leaves.
         * Only one cancelable can be specified per section.
         */
        cancelable(sectionSetup?: () => void): SectionChain

        /**
         * The modified section can be interrupted when one of the events
         * is triggered on a body associated with a speaker in the section
         */
        interruptible(
            condition?: Condition,
            sectionSetup?: () => void,
            ...events: body.CustomEventHandler<void>[]
        ): SectionChain
    }

    export interface Options {
        /** Multiplier on importance */
        importance: number
    }
}
