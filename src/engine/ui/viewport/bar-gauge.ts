namespace splitTime.ui {

    export class BarGauge implements Renderer {
        x: number = 0
        y: number = 0
        width: number = 128
        height: number = 20

        outlineStyle = "rgba(0, 0, 0, .5)"
        outlineWidth = 2
    
        constructor(
            private readonly fractionGetter: () => number,
            private readonly colorGetter: () => light.Color
        ) {

        }

        render(view: View): void {
            const roundedRect = new RoundedRect()
            roundedRect.cornerRadius = Math.min(roundedRect.cornerRadius, this.width / 2, this.height / 2)

            const left = mod(this.x, view.width)
            const top = mod(this.y, view.height)

            roundedRect.doPath(view.see, left, top, this.width, this.height)
            view.see.strokeStyle = this.outlineStyle
            view.see.lineWidth = this.outlineWidth
            view.see.stroke()

            try {
                view.see.save()
                view.see.clip()
                view.see.fillStyle = this.colorGetter().toRgbaString()
                view.see.fillRect(left, top, this.width * this.fractionGetter(), this.height)
            } finally {
                view.see.restore()
            }
        }
    }
}