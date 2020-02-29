namespace SplitTime.conversation {
    export class Speaker {
        name: string
        body: SplitTime.Body
        speechBox: SplitTime.body.SpeechBox

        constructor(name: string, body: SplitTime.Body) {
            this.name = name
            this.body = body
            this.speechBox = this.body.speechBox
        }
    }
}
