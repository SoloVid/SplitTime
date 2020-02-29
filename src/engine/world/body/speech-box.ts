namespace splitTime.body {
    export class SpeechBox implements ILevelLocation {
        body: Body
        offsetX: number
        offsetY: number
        offsetZ: number
        constructor(
            body: splitTime.Body,
            offsetZ: number = 0,
            offsetX: number = 0,
            offsetY: number = 0
        ) {
            this.body = body
            this.offsetX = offsetX
            this.offsetY = offsetY
            this.offsetZ = offsetZ
        }

        /**
         * @return number
         */
        getX() {
            return this.body.getX() + this.offsetX
        }
        /**
         * @return number
         */
        getY() {
            return this.body.getY() + this.offsetY
        }
        /**
         * @return number
         */
        getZ() {
            return this.body.getZ() + this.offsetZ
        }
        /**
         * @return splitTime.Level
         */
        getLevel() {
            return this.body.getLevel()
        }
    }
}
