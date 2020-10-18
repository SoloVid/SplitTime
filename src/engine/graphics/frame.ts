namespace splitTime.collage {
    export class Frame {
        constructor(
            readonly box: Readonly<math.Rect>,
            readonly offset: ReadonlyCoordinates2D,
            readonly duration: game_seconds
        ) {}
    }
}