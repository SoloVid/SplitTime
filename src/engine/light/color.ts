namespace splitTime.light {
    export class Color {
        constructor(
            public r: number,
            public g: number,
            public b: number,
            // Default setting is "not transparent" (alpha value of 1)
            public a: number = 1
        ) {}

        /**
         * Returns a string with CSS style for this color using the RGBA values
         */
        toRgbaString(): string {
            const rgbaString = "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")"
            
            //First check to make sure this color will work for CSS
            if (!this.isValidColor(rgbaString)){
                throw new Error("This is not a valid color: " + rgbaString)
            }

            return rgbaString
        }

        /**
         * Returns true if the string can be evaluated as a valid color in CSS
         * @param colorString 
         */
        isValidColor(colorString: string): boolean {
            const style = new Option().style
            style.color = colorString
            return style.color !== ''
        }
    }
}