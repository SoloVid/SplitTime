namespace SplitTime {
    export interface Callback<T> {
        call(param: T): void;
    }
}