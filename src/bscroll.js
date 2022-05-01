const _ = require("./util/index.js");
const TOUCH_EVENT = 1;
(function (window, document) {
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
        refresh() {
            const rf = this.wrapper.offsetHeight;
            this.wrapperWidth = this.wrapper.clientWidth;
            this.wrapperHeight = this.wrapper.clientHeight;

            this.scrollerWidth = this.scroller.clientWidth;
            this.scrollerHeight = this.scroller.clientHeight;

            this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
            this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

            this.hasHorizontalScroll =
                this.options.scrollX && this.maxScrollX < 0;
            this.hasVerticalScroll =
                this.options.scrollY && this.maxScrollY < 0;

            if (!this.hasHorizontalScroll) {
                this.maxScrollX = 0;
                this.scrollerWidth = this.wrapperWidth;
            }

            if (!this.hasVerticalScroll) {
                this.maxScrollY = 0;
                this.scrollerHeight = this.wrapperHeight;
            }

            this.endTime = 0;
            this.wrapperOffset = _.offset(this.wrapper);

            this._trigger("refresh");

            this.resetPosition();
        },
        _start(e) {
            console.log("_start", e);
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
            this.initiated = eventType;
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
            this.directionLocked = 0;
            this._transitionTime();
            this.startTime = +new Date();
            if (this.options.useTransition && this.isInTransition) {
                this.isInTransition = false;
                const pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this._trigger("scrollEnd");
            } else if (!this.options.useTransition && this.isAnimating) {
                this.isAnimating = false;
                this._trigger("scrollEnd");
            }
            const point = e.touches ? e.touches[0] : e;
            this.startX = this.x;
            this.startY = this.y;
            this.pointX = point.pageX;
            this.pointY = point.pageY;
            this._trigger("beforeScrollStart");
        },
        _move(e) {
            console.log("move======", e);

            if (!this.enabled || _.eventType[e.type] !== this.initiated) return;

            if (this.options.preventDefault) {
                //TODO increase Android performance
                e.preventDefault();
            }
            const point = e.touches ? e.touches[0] : e;
            let deltaX = point.pageX - this.pointX;
            let deltaY = point.pageY - this.pointY;

            this.pointX = point.pageX;
            this.pointY = point.pageY;

            this.distX += deltaX;
            this.distY += deltaY;

            const absDistX = Math.abs(this.distX);
            const absDistY = Math.abs(this.distY);
            const timestamp = +new Date();
            if (
                timestamp - this.endTime > 300 &&
                absDistX < 10 &&
                absDistY < 10
            ) {
                return;
            }
            if (!this.directionLocked && !this.options.freeScroll) {
                if (absDistX > absDistY + this.options.directionLockThreshold) {
                    this.directionLocked = "h"; // lock horizontally
                } else if (
                    absDistY >=
                    absDistX + this.options.directionLockThreshold
                ) {
                    this.directionLocked = "v"; // lock vertically
                } else {
                    this.directionLocked = "n"; // no lock
                }
            }
            if (this.directionLocked === "h") {
                if (this.options.eventPassthrough === "vertical") {
                    e.preventDefault();
                } else if (this.options.eventPassthrough === "horizontal") {
                    this.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if (this.directionLocked === "v") {
                if (this.options.eventPassthrough === "horizontal") {
                    e.preventDefault();
                } else if (this.options.eventPassthrough === "vertical") {
                    this.initiated = false;
                    return;
                }
                deltaX = 0;
            }
            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;

            let newX = this.x + deltaX;
            let newY = this.y + deltaY;

            if (newX > 0 || newX < this.maxScrollX) {
                newX = this.x + deltaX / 3;
            }
            if (newY > 0 || newY < this.maxScrollY) {
                console.log('sssss')
                newY = this.y + deltaY / 3;
            }

            if (!this.moved) {
                this.moved = true;
                this._trigger("scrollStart");
            }
            console.log(newY, newX);
            this._translate(newX, newY);
            if (timestamp - this.startTime > 300) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;
            }
            if (this.directionLocked === "h") {
                if (
                    this.pointX > document.documentElement.clientWidth - 10 ||
                    this.pointX < 10
                ) {
                    this._end(e);
                }
            }
            if (this.directionLocked === "v") {
                if (
                    this.pointY > document.documentElement.clientHeight - 10 ||
                    this.pointY < 10
                ) {
                    console.log("dddd");
                    this._end(e);
                }
            }
        },
        _end(e) {
            console.log("end=====", e);
            if (!this.enabled || _.eventType[e.type] !== this.initiated) {
                return;
            }
            this.initiated = false;
            if (
                this.options.preventDefault &&
                !_.preventDefaultException(
                    e.target,
                    this.options.preventDefaultException
                )
            ) {
                e.preventDefault();
            }
            if (this.resetPosition(this.options.bounceTime, _.ease.bounce)) {
                return;
            }
        },
        _trigger(type) {
            const events = this._events[type];
            if (!events) {
                return;
            }
            for (const event of events) {
                event.apply(this, [].slice.call(arguments, 1));
            }
        },
        scrollTo(x, y, time, ease) {
            ease = ease || _.ease.bounce;
            this.isInTransition = this.options.useTransition && time > 0;
            if (!time || (this.options.useTransition && ease.style)) {
                this._transitionTimingFunction(ease.style);
                this._transitionTime(time);
                this._translate(x, y);
            }
        },
        enable() {
            this.enabled = true;
        },
        disable() {
            this.enabled = false;
        },
        _transitionTimingFunction: function (easing) {
            this.scrollerStyle[_.style.transitionTimingFunction] = easing;
        },
        _translate(x, y) {
            if (this.options.useTransform) {
                this.scrollerStyle[_.style.transform] =
                    "translate(" + x + "px," + y + "px)" + this.translateZ;
            } else {
                x = Math.round(x);
                y = Math.round(y);
                this.scrollerStyle.left = x + "px";
                this.scrollerStyle.top = y + "px";
            }

            this.x = x;
            this.y = y;
        },
        _animate(destX, destY, duration, easingFn) {},
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
        _resize() {
            const me = this;
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(function () {
                me.refresh();
            }, this.options.resizePolling);
        },
        getComputedPosition: function () {
            let matrix = window.getComputedStyle(this.scroller, null);
            let x;
            let y;

            if (this.options.useTransform) {
                matrix = matrix[_.style.transform].split(")")[0].split(", ");
                x = +(matrix[12] || matrix[4]);
                y = +(matrix[13] || matrix[5]);
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, "");
                y = +matrix.top.replace(/[^-\d.]/g, "");
            }

            return {
                x: x,
                y: y,
            };
        },
        _transitionEnd(e) {
            if (e.target !== this.scroller || !this.isIntransition) {
                return;
            }
            this._transitionTime();
            if (!this.resetPosition(this.options.bounceTime, _.ease.bounce)) {
                this.isInTransition = false;
                this._trigger("scrollEnd");
            }
        },
        _transitionTime(time) {
            time = time || 0;
            this.scrollerStyle[_.style.transitionDuration] = time + "ms";
            if (!time && _.isBadAndroid) {
                this.scrollerStyle[_.style.transitionDuration] = "0.001s";
            }
        },
        resetPosition(time, easeing) {
            time = time || 0;
            let x = this.x;
            let y = this.y;
            if (!this.hasVerticalScroll || y > 0) {
                y = 0;
            } else if (y < this.maxScrollY) {
                y = this.maxScrollY;
            }
            if (!this.hasHorizontalScroll || x > 0) {
                x = 0;
            } else if (x < this.maxScrollX) {
                x = this.maxScrollX;
            }
            if (x === this.x && y === this.y) {
                return false;
            }
            this.scrollTo(x, y, time, easeing);
            return true;
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
