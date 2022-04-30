const _ = module.exports;
const elementStyle = document.createElement("div").style;

const TOUCH_EVENT = 1;
const MOUSE_EVENT = 2;
const POINTER_EVENT = 3;
const vendor = (function () {
    const transformNames = {
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
function prefixStyle(style) {
    if (vendor === false) return false;

    if (vendor === "standard") {
        return style;
    }

    return vendor + style.charAt(0).toUpperCase() + style.substr(1);
}

const transform = prefixStyle("transform");
_.prefixPointerEvent = function (pointerEvent) {
    return window.MSPointerEvent
        ? "MSPointer" +
              pointerEvent.charAt(9).toUpperCase() +
              pointerEvent.substr(10)
        : pointerEvent;
};
_.extend = function (target, obj) {
    for (var key in obj) {
        target[key] = obj[key];
    }
};
_.addEvent = function (el, type, fn, capture) {
    el.addEventListener(type, fn, !!capture);
};
_.removeEvent = function (el, type, fn, capture) {
    el.removeEventListener(type, fn, !!capture);
};
_.extend(_, {
    hasTransform: transform !== false,
    hasPerspective: prefixStyle("perspective") in elementStyle,
    hasTouch: "ontouchstart" in window,
    // IE10 is prefixed
    hasPointer: window.PointerEvent || window.MSPointerEvent,
    hasTransition: prefixStyle("transition") in elementStyle,
});
_.style = {};

_.extend(_.style, {
    transform: transform,
    transitionTimingFunction: prefixStyle("transitionTimingFunction"),
    transitionDuration: prefixStyle("transitionDuration"),
    transitionDelay: prefixStyle("transitionDelay"),
    transformOrigin: prefixStyle("transformOrigin"),
    transitionEnd: prefixStyle("transitionEnd"),
});
_.eventType = {};

_.extend(_.eventType, {
    touchstart: TOUCH_EVENT,
    touchmove: TOUCH_EVENT,
    touchend: TOUCH_EVENT,

    mousedown: MOUSE_EVENT,
    mousemove: MOUSE_EVENT,
    mouseup: MOUSE_EVENT,

    pointerdown: POINTER_EVENT,
    pointermove: POINTER_EVENT,
    pointerup: POINTER_EVENT,

    MSPointerDown: POINTER_EVENT,
    MSPointerMove: POINTER_EVENT,
    MSPointerUp: POINTER_EVENT,
});
