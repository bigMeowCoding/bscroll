const _ = require("./util/index.js");

(function (window, document, Math) {
    function BScroll(el, options) {
        this.wrapper = typeof el === "string" ? document.querySelector(el) : el;
        this.scroller = this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style;
        this.options = {
            startX: 0,
            startY: 0,
            scrollY: true,
            directionLockThreshold: 5,
            momentum: true,

            bounce: true,

            swipeTime: 3000,
            bounceTime: 600,
            swipeBounceTime: 1200,

            preventDefault: true,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/,
            },

            HWCompositing: true,
            useTransition: true,
            useTransform: true,
        };
        _.extend(this.options, options);
        this.translateZ =
            this.options.HWCompositing && _.hasPerspective
                ? " translateZ(0)"
                : "";

        this.options.useTransition =
            this.options.useTransition && _.hasTransition;
        this.options.useTransform = this.options.useTransform && _.hasTransform;

        this.options.eventPassthrough =
            this.options.eventPassthrough === true
                ? "vertical"
                : this.options.eventPassthrough;
        this.options.preventDefault =
            !this.options.eventPassthrough && this.options.preventDefault;

        // If you want eventPassthrough I have to lock one of the axes
        this.options.scrollX =
            this.options.eventPassthrough === "horizontal"
                ? false
                : this.options.scrollX;
        this.options.scrollY =
            this.options.eventPassthrough === "vertical"
                ? false
                : this.options.scrollY;

        // With eventPassthrough we also need lockDirection mechanism
        this.options.freeScroll =
            this.options.freeScroll && !this.options.eventPassthrough;
        this.options.directionLockThreshold = this.options.eventPassthrough
            ? 0
            : this.options.directionLockThreshold;

        //TODO easing fn?
        //this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? _.ease[this.options.bounceEasing] || _.ease.circular : this.options.bounceEasing;

        this.options.resizePolling =
            this.options.resizePolling === undefined
                ? 60
                : this.options.resizePolling;

        if (this.options.tap === true) {
            this.options.tap = "tap";
        }
        console.log(this.options);
    }
    BScroll.prototype = {
        version: __VERSION__,
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = BScroll;
    } else if (typeof define === "function" && define.amd) {
        return BScroll;
    } else {
        window.BScroll = BScroll;
    }
})(window, document, Math);
