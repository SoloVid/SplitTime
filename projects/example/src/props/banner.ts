namespace G {
    G.BODY_TEMPLATES.register("banner", () => {
        var sprite = new splitTime.Sprite("banner.png")
        sprite.xres = 73
        sprite.yres = 135
        sprite.playerOcclusionFadeFactor = 0.7

        var body = new splitTime.Body()

        body.drawable = sprite
        body.baseLength = 32
        body.height = 128

        return body
    })
}