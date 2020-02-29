namespace splitTime {
    export interface Callback<T> {
        call(param: T): void;
    }
}