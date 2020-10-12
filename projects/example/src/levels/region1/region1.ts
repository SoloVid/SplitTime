namespace G.region1 {
    export const level = G.WORLD.getLevel("outside1")

    const lightGradient = new splitTime.light.Gradient()
    lightGradient.addColorStop(0, new splitTime.light.Color(0, 0, 15))
    lightGradient.addColorStop(0.25, new splitTime.light.Color(0, 0, 15))
    lightGradient.addColorStop(0.3, new splitTime.light.Color(50, 50, 100))
    lightGradient.addColorStop(0.35, new splitTime.light.Color(255, 255, 100))
    lightGradient.addColorStop(0.45, new splitTime.light.Color(255, 255, 255))
    lightGradient.addColorStop(0.75, new splitTime.light.Color(255, 255, 255))
    lightGradient.addColorStop(0.8, new splitTime.light.Color(255, 50, 50))
    lightGradient.addColorStop(0.85, new splitTime.light.Color(0, 0, 15))

    splitTime.CLOUDS_IMAGE = "storm-clouds.png"
    splitTime.RAIN_IMAGE = "rain.png"
    level.weather.isCloudy = true
    level.weather.isRaining = true

    function calculateLight(): string {
        const fractionThroughDay = mainTimeline.getTimeOfDay() / mainTimeline.day()
        return lightGradient.getColorAt(fractionThroughDay).toRgbaString()
    }

    level.weather.ambientLight = calculateLight

    level.registerEnterFunction(() => {
        G.ASSETS.audio.stop()
        G.ASSETS.audio.play("calm.mp3")
    })

    level.registerEvent("hall-back-ladder", player.getLadderEvent(splitTime.direction.S))

    export namespace position {
        export const townEntrance = level.getPosition("town-entrance")
        export const hallEntrance = level.getPosition("hall-entrance")
    }

    G.BODY_TEMPLATES.register("outside1-ramp", () => {
        var sprite = new splitTime.Sprite("outside1-ramp.png")
        sprite.xres = 312
        sprite.yres = 394
        sprite.playerOcclusionFadeFactor = 0.5

        var body = new splitTime.Body()

        body.drawable = sprite
        body.baseLength = 0

        return body
    })
}
