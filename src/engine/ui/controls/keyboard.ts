import { RegisterCallbacks, CallbackResult } from "engine/utils/register-callbacks";
import { __EDITOR__ } from "environment";
import { SPACE, DOWN, UP, LEFT, RIGHT } from "./keycode";

export class Keyboard {
    private keyDown: {
        [keyCode: number]: boolean;
    } = {};
    constructor(eventElement: HTMLElement | Document) {
        // The key event cancellations mess with editor functionality
        if (__EDITOR__) {
            return;
        }
        // FTODO: Is the cast going to cause problems here?
        eventElement.addEventListener("keydown", event => {
            return this.onKeyDown(event as KeyboardEvent);
        });
        eventElement.addEventListener("keyup", event => {
            return this.onKeyUp(event as KeyboardEvent);
        });
    }
    private downCallbacks: {
        [keyCode: number]: RegisterCallbacks;
    } = {};
    private getDownCallbacks(keyCode: number) {
        if (!this.downCallbacks[keyCode]) {
            this.downCallbacks[keyCode] = new RegisterCallbacks();
        }
        return this.downCallbacks[keyCode];
    }
    private upCallbacks: {
        [keyCode: number]: RegisterCallbacks;
    } = {};
    private getUpCallbacks(keyCode: number) {
        if (!this.upCallbacks[keyCode]) {
            this.upCallbacks[keyCode] = new RegisterCallbacks();
        }
        return this.upCallbacks[keyCode];
    }
    public isKeyDown(keyCode: number) {
        return !!this.keyDown[keyCode];
    }
    public waitForDown(keyCode: number) {
        return this.getDownCallbacks(keyCode).waitForOnce();
    }
    public onDown(keyCode: number, callback: () => CallbackResult) {
        this.getDownCallbacks(keyCode).register(callback);
    }
    public waitForUp(keyCode: number) {
        return this.getUpCallbacks(keyCode).waitForOnce();
    }
    public afterUp(keyCode: number, callback: () => CallbackResult) {
        this.getUpCallbacks(keyCode).register(callback);
    }
    //Sets variables useful for determining what keys are down at given time.
    public onKeyDown(e: KeyboardEvent) {
        var keyCode = e.which || e.keyCode;
        //Prevent scrolling with arrows
        if ([
            SPACE,
            DOWN,
            UP,
            LEFT,
            RIGHT
        ].indexOf(keyCode) > -1) {
            e.preventDefault();
        }
        var key = e.key.toLowerCase();
        if (key == "t") {
            // Note: This case is just here for quick and dirty testing
            // alert("Huzzah!")
        }
        this.keyDown[keyCode] = true;
        this.getDownCallbacks(keyCode).run();
    }
    //The clean-up of the above function.
    public onKeyUp(e: KeyboardEvent) {
        var keyCode = e.which || e.keyCode;
        this.keyDown[keyCode] = false;
        this.getUpCallbacks(keyCode).run();
    }
}
