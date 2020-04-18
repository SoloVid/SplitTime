namespace splitTime {
    export class WeatherSettings {
        isRaining: boolean = false
        // Number of lightning strikes per minute
        lightningFrequency: number = 0
        isCloudy: boolean = false
        // 0-1 invisible to fully visible
        cloudAlpha: number = 1
        // Color of light (e.g. black for darkness)
        ambientLight: string = "rgba(255, 255, 255, 1)"
    }
}
