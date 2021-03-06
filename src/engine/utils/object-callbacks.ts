namespace splitTime {
    /**
     * This class intended to be very similar to RegisterCallbacks or Promise
     * but with the advantage of accommodating serialization.
     * (Objects are easier to serialize than functions/lambdas.)
     */
    export class ObjectCallbacks<T> {
        private registerCallbacks: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks();
        private readonly callbacks: SimpleCallback<T>[] = [];

        constructor() {

        }

        getCallbacks(): readonly SimpleCallback<T>[] {
            return this.callbacks;
        }

        register(callback: SimpleCallback<T>): void {
            this.callbacks.push(callback);
            this.registerCallbacks.register((data: T) => callback.callBack(data));
        }

        /**
         * An alias for register() that provides a Promise-like interface
         */
        then(callback: SimpleCallback<T>): void {
            this.register(callback);
        }

        run(data: T): void {
            this.registerCallbacks.run(data)
        }
    }
}