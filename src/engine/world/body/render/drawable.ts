namespace splitTime.body {
    export interface Drawable extends TimeNotified {
        playerOcclusionFadeFactor: number
        opacityModifier: number

        getCanvasRequirements(
            x: number,
            y: number,
            z: number
        ): splitTime.body.CanvasRequirements

        draw(ctx: GenericCanvasRenderingContext2D): void

        prepareForRender(): void
        cleanupAfterRender(): void

        getLight(): Light | null

        clone(): Drawable
    }

    export class CanvasRequirements {
        x: int
        y: int
        z: int
        width: int
        height: int
        isCleared: boolean
        translateOrigin: boolean
        constructor(x: int, y: int, z: int, width: int, height: int) {
            // Level location for center of canvas
            this.x = x
            this.y = y
            this.z = z
            this.width = width
            this.height = height
            this.isCleared = false
            this.translateOrigin = true
        }
    }
}
