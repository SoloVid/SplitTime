namespace splitTime {
    export class Pledge implements PromiseLike<any> {
        callBacks: Function[]
        babyPromises: Pledge[]
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
                if (result instanceof splitTime.Pledge) {
                    return result
                } else {
                    return splitTime.Pledge.as(result)
                }
            } else {
                this.callBacks.push(callBack)

                var baby = new splitTime.Pledge()
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
                var babyPromise = this.babyPromises.shift() as splitTime.Pledge

                var result = callBack(data)

                if (result instanceof splitTime.Pledge) {
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
                                babyPromise.babyPromises.shift() as splitTime.Pledge
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
            var prom = new splitTime.Pledge()
            prom.resolve(data)
            return prom
        }
        static when(arr: splitTime.Pledge[]): PromiseLike<any> {
            if (!Array.isArray(arr)) {
                var newArr = new Array(arguments.length)
                for (var i = 0; i < arguments.length; i++) {
                    newArr[i] = arguments[i]
                }
                return splitTime.Pledge.when(newArr)
            }

            var prom = new splitTime.Pledge()
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
        static whenAny(arr: splitTime.Pledge[]): splitTime.Pledge {
            if (!Array.isArray(arr)) {
                var newArr = new Array(arguments.length)
                for (var i = 0; i < arguments.length; i++) {
                    newArr[i] = arguments[i]
                }
                return splitTime.Pledge.whenAny(newArr)
            }

            var prom = new splitTime.Pledge()
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
    export class PledgeCollection {
        promises: splitTime.Pledge[]
        constructor() {
            this.promises = []
        }
        add(prom: splitTime.Pledge) {
            this.promises.push(prom)
        }
        then(callBack: { (): void; (): void; (): void; (): void }) {
            return splitTime.Pledge.when(this.promises).then(callBack)
        }

        static wait(ms: number | undefined) {
            var promise = new splitTime.Pledge()
            setTimeout(function() {
                promise.resolve()
            }, ms)
            return promise
        }
    }

    export function getPlaceholderPledge(): Pledge {
        const ARBITRARY_PLACEHOLDER_TIME = 1000
        const pledge = new Pledge()
        setTimeout(() => {
            pledge.resolve()
        }, ARBITRARY_PLACEHOLDER_TIME)
        return pledge
    }
}
