namespace splitTime.light {
    export class Color {
        constructor(
            public r: number,
            public g: number,
            public b: number,
            public a?: number
        ) {
            // Default setting is "not transparent" (alpha value of 1)
            if (this.a == undefined) {
                this.a = 1
            }

            //Check to make sure the target rgba value is valid
            
        }

        /**
         * Returns a string with CSS style for this color using the RGBA values
         */
        toRgbaString(): string {
            var RgbaString = "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")"
            
            //First check to make sure this color will work for CSS
            if (!this.isValidColor(RgbaString)){
                throw new Error("This is not a valid color: " + RgbaString)
            }

            return RgbaString
        }

        /**
         * Returns true if this color object is a valid RGBA color in CSS 
         */
        isValidColor(RgbaString: string): boolean {
            var style = new Option().style
            style.color = RgbaString          
            return style.color !== ''
        }
    }
}