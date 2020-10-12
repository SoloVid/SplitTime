namespace G.region1.hall {
    export namespace floor1 {
        export const level = G.WORLD.getLevel("hall/hall-floor1")

        level.registerEnterFunction(() => {
            G.ASSETS.audio.stop()
            G.ASSETS.audio.play("dungeon.mp3")
        })

        export namespace position {
            export const DOOR = level.getPosition("door")
            export const MAN_IDLE = level.getPosition("man-idle")
        }
    }

    export namespace floor2 {
        export const level = G.WORLD.getLevel("hall/hall-floor2")

        level.registerEnterFunction(() => {
            G.ASSETS.audio.stop()
            G.ASSETS.audio.play("dungeon.mp3")
        })

        defer(() => {
            level.registerEvent("ladder-to-roof", player.getLadderEvent(splitTime.direction.N))
        })
    }

    G.BODY_TEMPLATES.register("hall-outside", () => {
        var sprite = new splitTime.Sprite("hall/hall-outside.png")
        sprite.xres = 512
        sprite.yres = 768
        sprite.playerOcclusionFadeFactor = 0.3

        var body = new splitTime.Body()

        body.drawable = sprite
        body.baseLength = 0

        return body
    })
}
