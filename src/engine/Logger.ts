SplitTime.Logger = {
    debug: function() {
        console.log.apply(null, arguments);
    },
    warn: function() {
        console.warn.apply(null, arguments);
    },
    error: function() {
        console.error.apply(null, arguments);
    }
};