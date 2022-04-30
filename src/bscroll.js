const _ = require("./util/index.js");
const TOUCH_EVENT = 1(function (window, document) {
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

        this.options.resizePolling =
            this.options.resizePolling === undefined
                ? 60
                : this.options.resizePolling;

        if (this.options.tap === true) {
            this.options.tap = "tap";
        }
        console.log(this.options);
        this._init();

        this.refresh();

        this.scrollTo(this.options.startX, this.options.startY);

        this.enable();
    }
    BScroll.prototype = {
        // eslint-disable-next-line no-undef
        version: __VERSION__,
        _init() {
            this.x = 0;
            this.y = 0;
            this._events = {};
            this._addEvents();
        },
        _addEvents() {
            this._handleEvents(_.addEvent);
        },
        _handleEvents(eventOperation) {
            const target = this.options.bindToWrapper ? this.wrapper : window;
            eventOperation(window, "orientationchange", this);
            eventOperation(window, "resize", this);
            if (this.options.click) {
                eventOperation(this.wrapper, "click", this);
            }
            if (!this.options.disableMouse) {
                eventOperation(this.wrapper, "mousedown", this);
                eventOperation(target, "mousemove", this);
                eventOperation(target, "mousecancel", this);
                eventOperation(target, "mouseup", this);
            }
            if (_.hasPointer && !this.options.disablePointer) {
                eventOperation(
                    this.wrapper,
                    _.prefixPointerEvent("pointerdown"),
                    this
                );
                eventOperation(
                    target,
                    _.prefixPointerEvent("pointermove"),
                    this
                );
                eventOperation(
                    target,
                    _.prefixPointerEvent("pointercancel"),
                    this
                );
                eventOperation(target, _.prefixPointerEvent("pointerup"), this);
            }

            if (_.hasTouch && !this.options.disableTouch) {
                eventOperation(this.wrapper, "touchstart", this);
                eventOperation(target, "touchmove", this);
                eventOperation(target, "touchcancel", this);
                eventOperation(target, "touchend", this);
            }
            eventOperation(this.scroller, _.style.transitionEnd, this);
        },
        refresh() {},
        scrollTo() {},
        enable() {
            this.enabled = true;
        },
        disable() {
            this.enabled = false;
        },
        handleEvent: function (e) {
            switch (e.type) {
                case "touchstart":
                case "pointerdown":
                case "MSPointerDown":
                case "mousedown":
                    this._start(e);
                    break;
                case "touchmove":
                case "pointermove":
                case "MSPointerMove":
                case "mousemove":
                    this._move(e);
                    break;
                case "touchend":
                case "pointerup":
                case "MSPointerUp":
                case "mouseup":
                case "touchcancel":
                case "pointercancel":
                case "MSPointerCancel":
                case "mousecancel":
                    this._end(e);
                    break;
                case "orientationchange":
                case "resize":
                    this._resize();
                    break;
                case "transitionend":
                case "webkitTransitionEnd":
                case "oTransitionEnd":
                case "MSTransitionEnd":
                    this._transitionEnd(e);
                    break;
                case "click":
                    if (!e._constructed) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
            }
        },
        _start(e) {
            const eventType = _.eventType[e.type];
            if (eventType !== TOUCH_EVENT) {
                if (e.button !== 0) {
                    return;
                }
            }
            if (
                !this.enabled ||
                (this.initiated && eventType !== this.initiated)
            ) {
                return;
            }
            this.initiate = eventType;
            if (
                this.options.preventDefault &&
                !_.isBadAndroid &&
                !_.preventDefaultException(
                    e.target,
                    this.options.preventDefaultException
                )
            ) {
                e.preventDefault();
            }
            this.moved = false;
            this.distX = 0;
            this.distY = 0;
            //this.directionX = 0;
            //this.directionY = 0;
            this.directionLocked = 0;
        },
        _move() {},
        _end() {},
        _resize() {},
        _transitionEnd() {},
        _transitionTime(time) {
            time = time || 0;
            this.scrollerStyle[_.style.transitionDuration] = time + "ms";
            if (!time && _.isBadAndroid) {
                this.scrollerStyle[_.style.transitionDuration] = "0.001s";
            }
        },
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = BScroll;
    } else if (typeof define === "function" && define.amd) {
        return BScroll;
    } else {
        window.BScroll = BScroll;
    }
})(window, document, Math);
