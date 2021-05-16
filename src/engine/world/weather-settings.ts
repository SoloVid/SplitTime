namespace splitTime {
    export class WeatherSettings {
        isRaining: boolean = false
        // Number of lightning strikes per minute
        lightningFrequency: number = 0
        isCloudy: boolean = false
        // 0-1 invisible to fully visible
        cloudAlpha: number = 1
        // Color of light (e.g. black for darkness)
        ambientLight: Indirect<light.Color> = new light.Color(255, 255, 255)

        getAmbientLight(): light.Color {
            return redirect(this.ambientLight)
        }
    }
}
