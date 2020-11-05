namespace splitTime.conversation {
    export class Speaker {
        name: string
        body: splitTime.Body
        speechBox: splitTime.body.SpeechBox

        constructor(name: string, body: splitTime.Body) {
            this.name = name
            this.body = body
            // TODO: re-evaluate this speech box
            this.speechBox = new splitTime.body.SpeechBox(body, 42)
        }

        behavior(): npc.ConditionalBehavior {
            return {
                isConditionMet() {
                    // TODO: check conversation manager
                    return false
                },
                notifyTimeAdvance(delta: game_seconds) {}
            }
        }
    }
}
