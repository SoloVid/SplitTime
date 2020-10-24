namespace splitTime.light {

    //This is only used for color validation. It will not be drawn.
    var dummyContext: GenericCanvasRenderingContext2D | null = null

    export class Color {
        private cssColorString: string
        private _r: number
        private _g: number
        private _b: number
        private _a: number

        //Wrap RGBA values with get/set methods & update the color string whenever they change
        public get r(): number {
            return this._r
        }
        public set r(value: number) {
            this._r = value
            this.setColorString()
        }
        public get g(): number {
            return this._g
        }
        public set g(value: number) {
            this._g = value
            this.setColorString()
        }
        public get b(): number {
            return this._b
        }
        public set b(value: number) {
            this._b = value
            this.setColorString()
        }
        public get a(): number {
            return this._a
        }
        public set a(value: number) {
            this._a = value
        }

        /**
         * Creates a Color object from RGB(A) values
         */
        constructor(red: number,
            green: number,
            blue: number,
            alpha?: number)
        /**
         * Creates a Color object from a string
         * 
         * @param args - a string that can be evaluated as a color by CSS 
         */
        constructor(colorString: string)
        constructor(...args: [
            red: number,
            green: number,
            blue: number,
            alpha?: number,
        ] | [colorString: string]) {
            this.cssColorString = ""
            
            // Default setting is "not transparent" (alpha value of 1)
            this._a = 1

            //If the argument is a string, it should evaluate as a CSS color, such as "white" or "Chartreuse"
            if (typeof args[0] === "string") {
                this.cssColorString = args[0]
                
                const rgbaData = Color.stringToRgbaData(this.cssColorString)
                assert(!!rgbaData, "Error: unable to convert string to RGBA values")
                this._r = rgbaData[0]
                this._g = rgbaData[1]
                this._b = rgbaData[2]
                this._a = rgbaData[3]
            }
            //If the user passed in the RGB(A) numerical values
            else if (
                    typeof args[0] === "number" &&
                    typeof args[1] === "number" &&
                    typeof args[2] === "number"
                ) {
                this._r = args[0]
                this._g = args[1]
                this._b = args[2]
                if (args[3]) {
                    this._a = args[3]
                }

                //Build the CSS string from RGBA values
                this.setColorString()
            }
            else {
                //Sanity check to make sure we are handling arguments properly                
                throw new Error("Invalid arguments to Color constructor: " + args.toString())
            }
        }

        /**
         * Rebuild the CSS color string after RGBA values have changed.
         */
        private setColorString(): boolean {
            var rgba = this.toRgbaString()
            
            //Make sure this will evaluate to a valid CSS color
            assert(Color.isValidColor(rgba), "Error: invalid RGBA values: " + rgba)

            this.cssColorString = rgba
            return true
        }

        /**
         * Returns a string with CSS style for this color using the RGBA values
         */
        toRgbaString(): string {
            return "rgba(" + this._r + ", " + this._g + ", " + this._b + ", " + this._a + ")"
        }

        /**
         * Returns true if the color can be evaluated as a valid color in CSS
         */
        static isValidColor(colorString: string): boolean {
            return Color.stringToRgbaData(colorString) !== null
        }

        /**
         * Evaluates a string as a color in CSS syntax and returns {r, g, b, a} or null for invalid colors
         * @param colorString the string to evaluate in CSS
         */
        static stringToRgbaData(colorString: string): Uint8ClampedArray | null {
            assert(!__NODE__, "Converting a string to RGBA data isn't available in Node.js")
            
            if (!dummyContext) {
                //Initialize the dummy context the first time we validate a color
                dummyContext = new splitTime.Canvas(1,1).context;
            }
            //Try setting fillStyle to see if CSS syntax will accept the string
            //(fillStyle will not change if the color is invalid)
            dummyContext.fillStyle = "#123456"
            dummyContext.fillStyle = colorString
            if (dummyContext.fillStyle === "#123456") {
                //Double-check to make sure it isn't actually #123456
                dummyContext.fillStyle = "#000000"
                dummyContext.fillStyle = colorString
                if(dummyContext.fillStyle === "#000000") {
                    //It's an invalid color
                    return null
                }
            }

            dummyContext.fillRect(0,0,1,1)
            return dummyContext.getImageData(0,0,1,1).data
        }
    }
}