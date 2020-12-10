namespace splitTime.conversation {
    export class Speaker {
        name: string = ""
        speechBox: splitTime.body.SpeechBox

        constructor(
            private readonly secretary: Secretary,
            public readonly body: splitTime.Body
        ) {
            // TODO: re-evaluate this speech box
            this.speechBox = new splitTime.body.SpeechBox(body, body.height)
        }

        getBehavior(): npc.ConditionalBehavior {
            return {
                isConditionMet: () => {
                    return this.secretary.isSpeakerConversing(this)
                },
                notifyTimeAdvance(delta: game_seconds) {
                    // Do nothing. The conversation manager system is handling the behavior.
                }
            }
        }

        isConversing(): boolean {
            return this.secretary.isSpeakerConversing(this)
        }
    }
}
