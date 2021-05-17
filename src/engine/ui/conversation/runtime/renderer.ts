namespace splitTime.conversation {
    class DialogDrawing {
        public readonly firstCharacterSeen: number

        constructor(
            public dialog: SpeechBubbleState,
            public incoming: boolean = true,
            public visibility: number = 0
        ) {
            const ELISION_PATTERN_LENGTH = 4
            const charsSeen = dialog.getDisplayedCurrentLine().length
            const roundedCharsSeen = charsSeen - (charsSeen % ELISION_PATTERN_LENGTH)
            this.firstCharacterSeen = Math.max(0, roundedCharsSeen - 1)
        }
    }

    const CONFIG = {
        OUTLINE_STYLE: "rgba(255, 255, 255, .8)",
        OUTLINE_WIDTH: 3,
        BACKGROUND_STYLE: "rgba(50, 100, 150, .4)",
        TEXT_OUTLINE_COLOR: "#000000",
        TEXT_OUTLINE_WIDTH: 5,
        TEXT_COLOR: "#FFFFFF",
        FONT_SIZE: 18,
        FONT: "Verdana",
        SPEAKER_NAMES_ENABLED: false
    }
    export const Configuration = CONFIG

    const MAX_ROW_LENGTH = 500
    const MIN_ROW_LENGTH_SPLIT = 100
    const LINE_SPACING = 2
    export const IDEAL_TAIL_LENGTH = 16
    export const TRI_BASE_TO_TAIL_LENGTH = 2 / 3
    const TEXT_BOX_PADDING = 10
    const IDEAL_HEIGHT_TO_WIDTH = 7 / 16
    const FOCAL_MARGIN = 20
    const MIN_SCREEN_MARGIN = 10

    export class Renderer {
        private dialogDrawings: DialogDrawing[] = []

        constructor(private readonly camera: Camera) {}

        show(dialog: SpeechBubbleState) {
            this.dialogDrawings.push(new DialogDrawing(dialog))
        }

        hide(dialog: SpeechBubbleState) {
            for (const drawing of this.dialogDrawings) {
                if (drawing.dialog === dialog) {
                    drawing.incoming = false
                }
            }
        }

        notifyFrameUpdate() {
            for (const drawing of this.dialogDrawings) {
                if (drawing.incoming) {
                    drawing.visibility = splitTime.approachValue(
                        drawing.visibility,
                        1,
                        0.1
                    )
                    // TODO: remove temporary hackaround bad UX
                    drawing.visibility = 1
                    // TODO: Maybe add event here for dialog fully visible
                } else {
                    drawing.visibility = splitTime.approachValue(
                        drawing.visibility,
                        0,
                        0.1 
                    )
                    // TODO: remove temporary hackaround bad UX
                    drawing.visibility = 0
                    // TODO: Maybe add event here for dialog gone
                }
            }
            this.dialogDrawings = this.dialogDrawings.filter(d => d.visibility > 0);
        }

        render(view: ui.View) {
            for (const drawing of this.dialogDrawings) {
                // TODO: visibility
                const ELISION_CHAR = "."
                let elision = new Array(drawing.firstCharacterSeen + 1).join(ELISION_CHAR)
                elision = elision.replace(/..../g, "... ")
                const elisionRegex = new RegExp("^.{" + drawing.firstCharacterSeen + "}")
                var dialog = drawing.dialog
                var location = dialog.getLocation()
                if (location) {
                    this.sayFromBoardFocalPoint(
                        view.see,
                        {
                            x: location.x,
                            y: location.y,
                            z: location.z
                        },
                        dialog.getLineForMeasurement().replace(elisionRegex, elision),
                        dialog.getDisplayedCurrentLine().replace(elisionRegex, elision),
                        dialog.speaker ?? ""
                    )
                } else {
                    this.simpleMessage(
                        view.see,
                        dialog.getLineForMeasurement().replace(elisionRegex, elision),
                        dialog.getDisplayedCurrentLine().replace(elisionRegex, elision)
                    )
                }
            }
        }

        private drawAwesomeRect(
            left: number,
            top: number,
            right: number,
            bottom: number,
            ctx: GenericCanvasRenderingContext2D,
            pointX?: number,
            pointY?: number
        ) {
            const CURVE_RADIUS = 10
            const TRI_CURVE_BUFFER = 2 * CURVE_RADIUS
            const TRI_BASE_HALF =
                (IDEAL_TAIL_LENGTH * TRI_BASE_TO_TAIL_LENGTH) / 2
            let horizontalMid = (left + right) / 2
            let verticalMid = (top + bottom) / 2

            let isLeft = false
            let isTop = false
            let isRight = false
            let isBottom = false
            if (pointX !== undefined && pointY !== undefined) {
                horizontalMid = splitTime.constrain(
                    (2 * pointX + left + right) / 4,
                    left + TRI_CURVE_BUFFER,
                    right - TRI_CURVE_BUFFER
                )
                verticalMid = splitTime.constrain(
                    (2 * pointY + top + bottom) / 4,
                    top + TRI_CURVE_BUFFER,
                    bottom - TRI_CURVE_BUFFER
                )

                const dLeft = left - pointX
                const dTop = top - pointY
                const dRight = pointX - right
                const dBottom = pointY - bottom
                if (pointX < left && dLeft >= dTop && dLeft > dBottom) {
                    isLeft = true
                } else if (pointY < top && dTop > dRight) {
                    isTop = true
                } else if (pointX > right && dRight > dBottom) {
                    isRight = true
                } else if (pointY > bottom) {
                    isBottom = true
                }
            }

            ctx.beginPath()
            ctx.moveTo(left + CURVE_RADIUS, top)
            if (isTop) {
                ctx.lineTo(horizontalMid - TRI_BASE_HALF, top)
                ctx.lineTo(pointX!, pointY!)
                ctx.lineTo(horizontalMid + TRI_BASE_HALF, top)
            }
            ctx.lineTo(right - CURVE_RADIUS, top)
            ctx.arc(
                right - CURVE_RADIUS,
                top + CURVE_RADIUS,
                CURVE_RADIUS,
                1.5 * Math.PI,
                0,
                false
            )
            if (isRight) {
                ctx.lineTo(right, verticalMid - TRI_BASE_HALF)
                ctx.lineTo(pointX!, pointY!)
                ctx.lineTo(right, verticalMid + TRI_BASE_HALF)
            }
            ctx.lineTo(right, bottom - CURVE_RADIUS)
            ctx.arc(
                right - CURVE_RADIUS,
                bottom - CURVE_RADIUS,
                CURVE_RADIUS,
                0,
                0.5 * Math.PI,
                false
            )
            if (isBottom) {
                ctx.lineTo(horizontalMid + TRI_BASE_HALF, bottom)
                ctx.lineTo(pointX!, pointY!)
                ctx.lineTo(horizontalMid - TRI_BASE_HALF, bottom)
            }
            ctx.lineTo(left + CURVE_RADIUS, bottom)
            ctx.arc(
                left + CURVE_RADIUS,
                bottom - CURVE_RADIUS,
                CURVE_RADIUS,
                0.5 * Math.PI,
                Math.PI,
                false
            )
            if (isLeft) {
                ctx.lineTo(left, verticalMid + TRI_BASE_HALF)
                ctx.lineTo(pointX!, pointY!)
                ctx.lineTo(left, verticalMid - TRI_BASE_HALF)
            }
            ctx.lineTo(left, top + CURVE_RADIUS)
            ctx.arc(
                left + CURVE_RADIUS,
                top + CURVE_RADIUS,
                CURVE_RADIUS,
                Math.PI,
                1.5 * Math.PI,
                false
            )
            ctx.closePath()

            ctx.strokeStyle = CONFIG.OUTLINE_STYLE
            ctx.lineWidth = CONFIG.OUTLINE_WIDTH
            ctx.stroke()

            ctx.fillStyle = CONFIG.BACKGROUND_STYLE
            ctx.fill()
        }

        private simpleMessage(
            ctx: GenericCanvasRenderingContext2D,
            fullMessage: string,
            displayedMessage: string
        ) {
            this.drawSpeechBubble(
                ctx,
                fullMessage,
                displayedMessage,
                (areaWidth, areaHeight) => {
                    return {
                        left: this.camera.SCREEN_WIDTH / 2 - areaWidth / 2,
                        top: this.camera.SCREEN_HEIGHT / 2 - areaHeight / 2
                    }
                }
            )
        }

        private sayFromBoardFocalPoint(
            ctx: GenericCanvasRenderingContext2D,
            focalPoint: { x: number; y: number; z: number },
            fullMessage: string,
            displayedMessage: string,
            speakerName: string
        ) {
            var pointRelativeToScreen = this.camera.getRelativeToScreen(
                focalPoint
            )
            this.drawSpeechBubble(
                ctx,
                fullMessage,
                displayedMessage,
                (areaWidth, areaHeight) => this.calculateDialogPosition(
                    areaWidth, areaHeight,
                    pointRelativeToScreen.x, pointRelativeToScreen.y
                ),
                speakerName
            )
        }

        private drawSpeechBubble(
            ctx: GenericCanvasRenderingContext2D,
            fullMessage: string,
            displayedMessage: string,
            calculatePosition: PositionCalculator,
            speakerName?: string
        ) {
            // TODO: isn't top what we want here? but it looks funny
            ctx.textBaseline = "hanging"
            ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT

            const textHeight = this.getLineHeight(ctx)
            const lineHeight = textHeight + LINE_SPACING

            const namePadding = TEXT_BOX_PADDING
            let nameWidth = 0
            let nameBoxHeight = 0
            let nameBoxWidth = 0
            if (CONFIG.SPEAKER_NAMES_ENABLED && speakerName) {
                nameWidth = ctx.measureText(speakerName).width
                nameBoxHeight = textHeight + 2 * namePadding
                nameBoxWidth = nameWidth + 2 * namePadding
            }

            const maxTextWidth = this.calculateIdealizedMaxWidth(
                ctx,
                fullMessage,
                lineHeight,
                nameWidth
            )
            const lines = this.getLinesFromMessage(
                fullMessage,
                displayedMessage,
                ctx,
                maxTextWidth
            )

            const bubbleWidth =
                Math.max(lines.maxWidth, nameWidth) + 2 * TEXT_BOX_PADDING
            const wholeBubbleTextHeight = lines.all.length * lineHeight
            const bubbleHeight = wholeBubbleTextHeight + 2 * TEXT_BOX_PADDING

            const position = calculatePosition(
                bubbleWidth,
                bubbleHeight + nameBoxHeight
            )

            let nameBoxShouldBeTop = true
            if (isPositionPointed(position)) {
                nameBoxShouldBeTop = position.triPointY > position.top
            }

            const messageTop =
                nameBoxShouldBeTop
                    ? position.top + nameBoxHeight
                    : position.top

            //Text box
            if (isPositionPointed(position)) {
                this.drawAwesomeRect(
                    position.left,
                    messageTop,
                    position.left + bubbleWidth,
                    messageTop + bubbleHeight,
                    ctx,
                    position.triPointX,
                    position.triPointY
                )
            } else {
                this.drawAwesomeRect(
                    position.left,
                    messageTop,
                    position.left + bubbleWidth,
                    messageTop + bubbleHeight,
                    ctx
                )
            }

            //Lines
            for (var index = 0; index < lines.displayed.length; index++) {
                this.drawText(
                    ctx,
                    lines.displayed[index],
                    position.left + TEXT_BOX_PADDING,
                    messageTop + lineHeight * index + TEXT_BOX_PADDING
                )
            }

            // Draw speaker box afterward in case it needs to cover part of the triangle
            if (CONFIG.SPEAKER_NAMES_ENABLED && speakerName) {
                var nameTop =
                    nameBoxShouldBeTop
                        ? position.top
                        : position.top + bubbleHeight
                var nameBoxLeft = position.left
                //Name box
                this.drawAwesomeRect(
                    nameBoxLeft,
                    nameTop,
                    nameBoxLeft + nameBoxWidth,
                    nameTop + nameBoxHeight,
                    ctx
                )
                //Name
                this.drawText(
                    ctx,
                    speakerName,
                    nameBoxLeft + namePadding,
                    nameTop + namePadding
                )
            }
        }

        private drawText(
            ctx: GenericCanvasRenderingContext2D,
            text: string,
            x: number,
            y: number
        ) {
            ctx.strokeStyle = CONFIG.TEXT_OUTLINE_COLOR
            ctx.lineWidth = CONFIG.TEXT_OUTLINE_WIDTH
            ctx.lineJoin = "round"
            ctx.miterLimit = 2
            ctx.strokeText(text, x, y)
            ctx.fillStyle = CONFIG.TEXT_COLOR
            ctx.fillText(text, x, y)
        }

        private calculateIdealizedMaxWidth(
            ctx: GenericCanvasRenderingContext2D,
            fullMessage: string,
            lineHeight: number,
            nameWidth: number
        ): number {
            var singleLineWidth = ctx.measureText(fullMessage).width
            var singleLineArea = singleLineWidth * lineHeight
            var proposedWidth =
                Math.sqrt(singleLineArea / IDEAL_HEIGHT_TO_WIDTH) +
                3 * lineHeight
            return Math.min(
                MAX_ROW_LENGTH,
                Math.max(MIN_ROW_LENGTH_SPLIT, nameWidth, proposedWidth)
            )
        }

        private calculateDialogPosition(
            areaWidth: number,
            areaHeight: number,
            focalPointX: number,
            focalPointY: number
        ): PointedDialogPosition {
            // Start centered (around focal point) horizontally
            var idealLeft = splitTime.constrain(
                focalPointX - areaWidth / 2, // ideal
                MIN_SCREEN_MARGIN, // left side of screen
                this.camera.SCREEN_WIDTH - MIN_SCREEN_MARGIN - areaWidth // right side of screen
            )
            var left = idealLeft

            // Try to make the dialog be above the focal point
            var top =
                focalPointY - (areaHeight + IDEAL_TAIL_LENGTH + FOCAL_MARGIN)
            if (top < MIN_SCREEN_MARGIN) {
                // If that is off screen, try below
                top = focalPointY + (FOCAL_MARGIN + IDEAL_TAIL_LENGTH)

                if (
                    top + areaHeight >
                    this.camera.SCREEN_HEIGHT - MIN_SCREEN_MARGIN
                ) {
                    // If below is also off screen, try switching to more of a horizontal approach
                    var idealTop = splitTime.constrain(
                        focalPointY - areaHeight / 2, // ideal
                        MIN_SCREEN_MARGIN, // top of screen
                        this.camera.SCREEN_HEIGHT -
                            MIN_SCREEN_MARGIN -
                            areaHeight // bottom of screen
                    )
                    top = idealTop

                    // TODO: prefer away from player rather than left over right
                    // Try to make dialog be to the left of focal point
                    left =
                        focalPointX -
                        (areaWidth + IDEAL_TAIL_LENGTH + FOCAL_MARGIN)
                    if (left < MIN_SCREEN_MARGIN) {
                        // If that is off screen, try to the right
                        left = focalPointX + (FOCAL_MARGIN + IDEAL_TAIL_LENGTH)

                        if (
                            left + areaWidth >
                            this.camera.SCREEN_WIDTH - MIN_SCREEN_MARGIN
                        ) {
                            // At this point, give up trying to avoid the focal point
                            left = idealLeft
                            top = idealTop
                        }
                    }
                }
            }

            // Determine off-focal point
            var centerX = left + areaWidth / 2
            var centerY = top + areaHeight / 2
            var dx = centerX - focalPointX
            var dy = centerY - focalPointY
            var dist = Math.sqrt(dx * dx + dy * dy)
            var triPointX = focalPointX + (dx / dist) * FOCAL_MARGIN
            var triPointY = focalPointY + (dy / dist) * FOCAL_MARGIN

            return {
                left: left,
                top: top,
                triPointX: triPointX,
                triPointY: triPointY
            }
        }

        private getLinesFromMessage(
            fullMessage: string,
            displayedMessage: string,
            ctx: GenericCanvasRenderingContext2D,
            maxRowLength: number
        ): { maxWidth: number; all: string[]; displayed: string[] } {
            var initialFont = ctx.font
            ctx.font = CONFIG.FONT_SIZE + "px " + CONFIG.FONT

            function getLine(str: string) {
                var words = str.split(" ")
                var nextWord = words.shift() as string
                var line = nextWord
                var width = ctx.measureText(line).width
                while (words.length > 0 && width < maxRowLength) {
                    nextWord = words.shift() as string
                    line += " " + nextWord
                    width = ctx.measureText(line).width
                }

                if (width > maxRowLength && line !== nextWord) {
                    words.unshift(nextWord)
                    line = line.substr(0, line.length - (nextWord.length + 1))
                }

                return line
            }

            var allLines = []
            var displayedLines = []
            var maxWidth = 0

            var remainingFullMessage = fullMessage
            var remainingDisplayedMessage = displayedMessage
            while (remainingFullMessage.length > 0) {
                const i: int = allLines.length
                allLines[i] = getLine(remainingFullMessage)
                displayedLines[i] = allLines[i].substring(
                    0,
                    remainingDisplayedMessage.length
                )
                remainingFullMessage = remainingFullMessage
                    .substring(allLines[i].length)
                    .trim()
                remainingDisplayedMessage = remainingDisplayedMessage
                    .substring(displayedLines[i].length)
                    .trim()
                maxWidth = Math.max(
                    maxWidth,
                    ctx.measureText(allLines[i]).width
                )
            }

            ctx.font = initialFont

            return {
                maxWidth: maxWidth,
                all: allLines,
                displayed: displayedLines
            }
        }

        /**
         * @param {GenericCanvasRenderingContext2D} ctx
         * @return {number}
         */
        private getLineHeight(ctx: GenericCanvasRenderingContext2D): number {
            return CONFIG.FONT_SIZE
        }
    }

    type PositionCalculator = (
        areaWidth: number,
        areaHeight: number
    ) => DialogPosition | PointedDialogPosition

    interface DialogPosition {
        left: number
        top: number
    }
    interface PointedDialogPosition extends DialogPosition {
        triPointX: number
        triPointY: number
    }

    function isPositionPointed(position: DialogPosition): position is PointedDialogPosition {
        const p2 = position as PointedDialogPosition
        return p2.triPointX !== undefined && p2.triPointY !== undefined
    }
}
