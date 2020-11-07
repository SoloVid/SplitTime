namespace splitTime.controls {
    class KeyboardDirectionGroup {
        constructor(readonly dir: number, readonly keyCodes: int[]) {}
    }

    var MIN_TIME_BETWEEN_STROKES = 30
    export class JoyStick {
        private keyboardGroups: KeyboardDirectionGroup[] = []

        constructor(
            private readonly keyboard: Keyboard
        ) {}

        getDirection(): number | null {
            var x = 0
            var y = 0
            for (const group of this.keyboardGroups) {
                let down = false
                for (const keyCode of group.keyCodes) {
                    if (this.keyboard.isKeyDown(keyCode)) {
                        down = true
                        break
                    }
                }
                if (down) {
                    x += direction.getXMagnitude(group.dir)
                    y += direction.getYMagnitude(group.dir)
                }
            }

            if (x !== 0 || y !== 0) {
                return splitTime.direction.fromTo(0, 0, x, y)
            }
            return null
        }
        onTilt(callback: () => splitTime.CallbackResult) {
            var lastTrigger = performance.now()
            var isDone = false

            var innerCallback = function(): splitTime.CallbackResult {
                if (isDone) {
                    return splitTime.STOP_CALLBACKS
                }

                var newTime = performance.now()
                if (newTime - lastTrigger < MIN_TIME_BETWEEN_STROKES) {
                    return
                }
                lastTrigger = newTime

                const result = callback()
                if (result === splitTime.STOP_CALLBACKS) {
                    isDone = true
                }
                if (isDone) {
                    return splitTime.STOP_CALLBACKS
                }
            }

            for (const group of this.keyboardGroups) {
                for (const keyCode of group.keyCodes) {
                    this.keyboard.onDown(keyCode, innerCallback)
                }
            }
        }

        setKeyboardBindings(dir: number, ...keyCodes: int[]) {
            this.keyboardGroups = this.keyboardGroups.filter(
                group => group.dir !== dir
            )
            this.keyboardGroups.push(new KeyboardDirectionGroup(dir, keyCodes))
        }
    }
}
