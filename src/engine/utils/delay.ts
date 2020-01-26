namespace SplitTime {
	export function delay(seconds: number): Promise<unknown> {
		var promise = new Promise(resolve => {
			setTimeout(function() {
				resolve();
			}, seconds * 1000);
		});
		return promise;
	};
}
