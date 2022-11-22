import { Canvas, GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas";
import { constrain } from "engine/utils/misc";
import { __NODE__ } from "environment";
import { assert } from "globals";

//This is only used for color validation. It will not be drawn.
var dummyContext: GenericCanvasRenderingContext2D | null = null;
export class Color {
    private _cssString: string = "";
    private _r: number = 0;
    private _g: number = 0;
    private _b: number = 0;
    // Default setting is "not transparent" (alpha value of 1)
    private _a: number = 1;
    /**
     * Get the CSS String that we've already determined is a valid CSS color style
     */
    public get cssString(): string {
        return this._cssString;
    }
    /**
     * Set the CSS string and assert that it is a valid CSS color style
     */
    public set cssString(value: string) {
        this.setValuesFromString(value);
    }
    //Wrap RGBA values with get/set methods & update the color string whenever they change
    public get r(): number {
        return this._r;
    }
    public set r(value: number) {
        // assert(value >= 0 && value <= 255, "Red component must be a uint8")
        this._r = constrain(value, 0, 255);
        this.generateCssString();
    }
    public get g(): number {
        return this._g;
    }
    public set g(value: number) {
        // assert(value >= 0 && value <= 255, "Green component must be a uint8")
        this._g = constrain(value, 0, 255);
        this.generateCssString();
    }
    public get b(): number {
        return this._b;
    }
    public set b(value: number) {
        // assert(value >= 0 && value <= 255, "Blue component must be a uint8")
        this._b = constrain(value, 0, 255);
        this.generateCssString();
    }
    public get a(): number {
        return this._a;
    }
    public set a(value: number) {
        // assert(value >= 0 && value <= 1, "Alpha component must be a uint8")
        this._a = constrain(value, 0, 1);
        this.generateCssString();
    }
    /**
     * Creates a Color object from RGB(A) values
     */
    constructor(red: number, green: number, blue: number, alpha?: number);
    /**
     * Creates a Color object from a string
     *
     * @param colorString a string that can be evaluated as a color by CSS
     */
    constructor(colorString: string);
    constructor(...args: [
        red: number,
        green: number,
        blue: number,
        alpha?: number
    ] | [
        colorString: string
    ]) {
        //If the argument is a string, it should evaluate as a CSS color, such as "white" or "Chartreuse"
        if (typeof args[0] === "string") {
            this.cssString = args[0];
        }
        //If the user passed in the RGB(A) numerical values
        else if (typeof args[0] === "number" &&
            typeof args[1] === "number" &&
            typeof args[2] === "number") {
            this.r = args[0];
            this.g = args[1];
            this.b = args[2];
            if (args[3] !== undefined) {
                this.a = args[3];
            }
        }
        else {
            //Sanity check to make sure we are handling arguments properly
            throw new Error("Invalid arguments to Color constructor: " + args.toString());
        }
    }
    /**
     * Rebuild the CSS color string after RGBA values have been set or updated.
     */
    private generateCssString() {
        this._cssString = this.toRgbaString();
    }
    /**
     * Sets cssString and RGBA values based on string input (and asserts that the string is a valid CSS color)
     * @param cssColorString - the color string to input
     */
    private setValuesFromString(cssColorString: string) {
        this._cssString = cssColorString;
        const rgbaData = Color.stringToRgbaData(this._cssString);
        assert(!!rgbaData, "Unable to convert string to RGBA values: " + this._cssString);
        this._r = rgbaData[0];
        this._g = rgbaData[1];
        this._b = rgbaData[2];
        this._a = 1;
    }
    /**
     * Returns the RGBA values as a string
     */
    private toRgbaString(): string {
        return "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._a + ")";
    }
    /**
     * Returns true if the color can be evaluated as a valid color in CSS
     */
    static isValidColor(colorString: string): boolean {
        return Color.evaluateColorStyle(colorString) !== null;
    }
    /**
     * Evaluates a string as a color in CSS syntax and returns {r, g, b, a} or null for invalid colors
     *
     * TODO: either document or change how this handles alpha (currently alpha gets set as a number from 0 - 255)
     *
     * @param colorString the string to evaluate in CSS
     */
    static stringToRgbaData(colorString: string): Uint8ClampedArray | null {
        assert(!__NODE__, "Converting a string to RGBA data isn't available in Node.js");
        if (!dummyContext) {
            //Initialize the dummy context the first time we validate a color
            dummyContext = new Canvas(1, 1).context;
        }
        const evaluatedStr = Color.evaluateColorStyle(colorString);
        if (!evaluatedStr) {
            return null;
        }
        dummyContext.fillRect(0, 0, 1, 1);
        return dummyContext.getImageData(0, 0, 1, 1).data;
    }
    /**
     * Evaluates a string as a color in CSS syntax and returns the evaluated string (or null for invalid colors)
     * @param colorString the string to evaluate in CSS
     */
    static evaluateColorStyle(colorString: string): string | null {
        if (!dummyContext) {
            //Initialize the dummy context the first time we validate a color
            dummyContext = new Canvas(1, 1).context;
        }
        //Try setting fillStyle to see if CSS syntax will accept the string
        //(fillStyle will not change if the color is invalid)
        dummyContext.fillStyle = "#123456";
        dummyContext.fillStyle = colorString;
        //If the fillStyle is still the same, it's probably invalid.
        if (dummyContext.fillStyle === "#123456") {
            //Double-check to make sure it isn't actually #123456
            dummyContext.fillStyle = "#000000";
            dummyContext.fillStyle = colorString;
            //This time, if the fillStyle didn't change, we know for sure that colorString is invalid.
            if (dummyContext.fillStyle === "#000000") {
                //It's an invalid color
                return null;
            }
        }
        return dummyContext.fillStyle;
    }
}
