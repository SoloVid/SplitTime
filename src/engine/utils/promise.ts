namespace SLVD {
    //Promises for SplitTime
    export class Promise implements PromiseLike<any> {
        callBacks: Function[]
        babyPromises: Promise[]
        resolved: boolean = false
        data: any
        constructor() {
            this.callBacks = []
            this.babyPromises = []
        }
        then(
            callBack?: (data?: any) => any | PromiseLike<any>,
            onRejected?: any
        ): PromiseLike<any> {
            if (!(callBack instanceof Function)) {
                throw new Error("callBack is not a function")
            }

            if (this.isResolved()) {
                var result = callBack(this.data)
                if (result instanceof SLVD.Promise) {
                    return result
                } else {
                    return SLVD.Promise.as(result)
                }
            } else {
                this.callBacks.push(callBack)

                var baby = new SLVD.Promise()
                this.babyPromises.push(baby)
                return baby
            }
        }

        resolve(data?: any) {
            if (this.resolved) {
                console.warn("Promise already resolved")
                return
            }

            this.resolved = true
            this.data = data

            while (this.callBacks.length > 0) {
                var callBack = this.callBacks.shift() as Function
                var babyPromise = this.babyPromises.shift() as SLVD.Promise

                var result = callBack(data)

                if (result instanceof SLVD.Promise) {
                    //callback returned promise
                    var tPromise = result
                    if (tPromise.isResolved()) {
                        //callback returned resolved promise
                        babyPromise.resolve(tPromise.data)
                    } else {
                        //callback returned unresolved promise
                        while (babyPromise.callBacks.length > 0) {
                            tPromise.callBacks.push(
                                babyPromise.callBacks.shift() as Function
                            )
                            tPromise.babyPromises.push(
                                babyPromise.babyPromises.shift() as SLVD.Promise
                            )
                        }
                    }
                } else {
                    //callback returned other data (or no data)
                    babyPromise.resolve(result)
                }
            }
        }
        isResolved() {
            return this.resolved
        }

        static as(data?: any) {
            var prom = new SLVD.Promise()
            prom.resolve(data)
            return prom
        }
        static when(arr: SLVD.Promise[]): PromiseLike<any> {
            if (!Array.isArray(arr)) {
                var newArr = new Array(arguments.length)
                for (var i = 0; i < arguments.length; i++) {
                    newArr[i] = arguments[i]
                }
                return SLVD.Promise.when(newArr)
            }

            var prom = new SLVD.Promise()
            var results: any[] = []

            function addResult(index: number, data: any) {
                results[index] = data
            }

            function checkResolve() {
                for (var iResult = 0; iResult < arr.length; iResult++) {
                    if (!(iResult in results)) {
                        return false
                    }
                }
                prom.resolve(results)
                return true
            }

            function makeSingleResolveHandler(index: number) {
                return function(data: any) {
                    addResult(index, data)
                    checkResolve()
                }
            }

            for (var iPromise = 0; iPromise < arr.length; iPromise++) {
                arr[iPromise].then(makeSingleResolveHandler(iPromise))
            }
            return prom
        }
        static whenAny(arr: SLVD.Promise[]): SLVD.Promise {
            if (!Array.isArray(arr)) {
                var newArr = new Array(arguments.length)
                for (var i = 0; i < arguments.length; i++) {
                    newArr[i] = arguments[i]
                }
                return SLVD.Promise.whenAny(newArr)
            }

            var prom = new SLVD.Promise()
            var isResolved = false

            function callback(data: any) {
                if (!isResolved) {
                    isResolved = true
                    prom.resolve(data)
                }
            }

            for (var iPromise = 0; iPromise < arr.length; iPromise++) {
                arr[iPromise].then(callback)
            }

            return prom
        }
    }
    export class PromiseCollection {
        promises: SLVD.Promise[]
        constructor() {
            this.promises = []
        }
        add(prom: SLVD.Promise) {
            this.promises.push(prom)
        }
        then(callBack: { (): void; (): void; (): void; (): void }) {
            return SLVD.Promise.when(this.promises).then(callBack)
        }

        static wait(ms: number | undefined) {
            var promise = new SLVD.Promise()
            setTimeout(function() {
                promise.resolve()
            }, ms)
            return promise
        }
    }
}
