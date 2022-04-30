const _ = module.exports;

const vendor = (function () {
    var transformNames = {
        standard: "transform",
        webkit: "webkitTransform",
        Moz: "MozTransform",
        O: "OTransform",
        ms: "msTransform",
    };

    for (var key in transformNames) {
        if (elementStyle[transformNames[key]] !== undefined) {
            return key;
        }
    }

    return false;
})();
_.extend = function (target, obj) {
    for (var key in obj) {
        target[key] = obj[key];
    }
};
