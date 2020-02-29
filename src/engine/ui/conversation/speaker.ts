namespace splitTime.conversation {
    export class Speaker {
        name: string
        body: splitTime.Body
        speechBox: splitTime.body.SpeechBox

        constructor(name: string, body: splitTime.Body) {
            this.name = name
            this.body = body
            this.speechBox = this.body.speechBox
        }
    }
}
