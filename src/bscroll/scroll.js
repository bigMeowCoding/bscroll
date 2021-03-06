import EventEmitter from "../util/eventEmitter";
import {
    addEvent,
    ease,
    eventType,
    extend,
    hasPerspective,
    hasTouch,
    momentum,
    offset,
    prepend,
    removeEvent,
    style,
} from "../util";

export class BScroll extends EventEmitter {
    constructor(el, options) {
        super();
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
            selectedIndex: 0,
            rotate: 25,
            wheel: false,
            snap: false,
            snapLoop: false,
            snapThreshold: 0.1,
            swipeTime: 2500,
            bounceTime: 700,
            adjustTime: 400,
            swipeBounceTime: 1200,
            deceleration: 0.001,
            momentumLimitTime: 300,
            momentumLimitDistance: 15,
            resizePolling: 60,
            preventDefault: true,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/,
            },
            HWCompositing: true,
            useTransition: true,
            useTransform: true,
        };
        extend(this.options, options);
        this.translateZ =
            this.options.HWCompositing && hasPerspective
                ? " translateZ(0)"
                : "";
        this._init();
        if (this.options.snap) {
            this._initSnap();
        }
        this.refresh();
        if (!this.options.snap) {
            this.scrollTo(this.options.startX, this.options.startY);
        }
        this.enable();
    }
    _initSnap() {
        this.currentPage = {};
        if (this.options.snapLoop) {
            const children = this.scroller.children;
            if (children.length > 0) {
                prepend(
                    children[children.length - 1].cloneNode(true),
                    children[0]
                );
                this.scroller.appendChild(children[1].cloneNode(true));
            }
        }
        this.on("refresh", () => {
            this.pages = [];
            if (
                !this.wrapperWidth ||
                !this.wrapperHeight ||
                !this.scrollerWidth ||
                !this.scrollerHeight
            ) {
                return;
            }
            let stepX = this.wrapperWidth;
            let stepY = this.wrapperHeight;
            let x = 0;
            let y;
            let cx;
            let cy;
            let i = 0;
            let l;
            cx = Math.floor(stepX / 2);
            cy = Math.floor(stepY / 2);
            while (x > -this.scrollerWidth) {
                this.pages[i] = [];
                l = 0;
                y = 0;
                while (y > -this.scrollerHeight) {
                    this.pages[i][l] = {
                        x: Math.max(this.maxScrollX, x),
                        y: Math.max(this.maxScrollY, y),
                        width: stepX,
                        height: stepY,
                        cx: x - cx,
                        cy: y - cy,
                    };
                    y -= stepY;
                    l++;
                }
                x -= stepX;
                i++;
            }

            let initPage = this.options.snapLoop ? 1 : 0;
            this.goToPage(
                this.currentPage.pageX || initPage,
                this.currentPage.pageY || 0,
                0
            );
            if (this.options.snapThreshold % 1 === 0) {
                this.snapThresholdX = this.options.snapThreshold;
                this.snapThresholdY = this.options.snapThreshold;
            } else {
                this.snapThresholdX = Math.round(
                    this.pages[this.currentPage.pageX][this.currentPage.pageY]
                        .width * this.options.snapThreshold
                );
                this.snapThresholdY = Math.round(
                    this.pages[this.currentPage.pageX][this.currentPage.pageY]
                        .height * this.options.snapThreshold
                );
            }
        });
        this.on("scrollEnd", () => {
            if (this.options.snapLoop) {
                if (this.currentPage.pageX === 0) {
                    this.goToPage(
                        this.pages.length - 2,
                        this.currentPage.pageY,
                        0
                    );
                }
                if (this.currentPage.pageX === this.pages.length - 1) {
                    this.goToPage(1, this.currentPage.pageY, 0);
                }
            }
        });
    }
    getCurrentPage() {
        return this.options.snap && this.currentPage;
    }
    goToPage(x, y, time, easing = ease.bounce) {
        if (x >= this.pages.length - 1) {
            x = this.pages.length - 1;
        } else if (x < 0) {
            x = 0;
        }
        if (y >= this.pages[x].length - 1) {
            y = this.pages[x].length - 1;
        } else if (y < 0) {
            y = 0;
        }
        let posX = this.pages[x][y].x;
        let posY = this.pages[x][y].y;
        time =
            time === undefined
                ? this.options.snapSpeed ||
                  Math.max(
                      Math.min(1000, Math.abs(posX - this.x)),
                      Math.min(1000, Math.abs(posY - this.y)),
                      300
                  )
                : time;
        this.currentPage = {
            x: posX,
            y: posY,
            pageX: x,
            pageY: y,
        };
        this.scrollTo(posX, posY, time, easing);
    }
    _nearestSnap(x, y) {
        if (!this.pages.length) {
            return { x: 0, y: 0, pageX: 0, pageY: 0 };
        }

        if (
            Math.abs(x - this.absStartX) < this.snapThresholdX &&
            Math.abs(y - this.absStartY) < this.snapThresholdY
        ) {
            return this.currentPage;
        }
        if (x > 0) {
            x = 0;
        } else if (x < this.maxScrollX) {
            x = this.maxScrollX;
        }
        if (y > 0) {
            y = 0;
        } else if (y < this.maxScrollY) {
            y = this.maxScrollY;
        }
        let i = 0;
        for (; i < this.pages.length; i++) {
            if (x >= this.pages[i][0].cx) {
                x = this.pages[i][0].x;
                break;
            }
        }
        let m = 0;
        for (; m < this.pages[i].length; m++) {
            if (y >= this.pages[i][m].cy) {
                y = this.pages[i][m].y;
                break;
            }
        }
        if (i === this.currentPage.pageX) {
            i += this.directionX;
            if (i < 0) {
                i = 0;
            } else if (i > this.pages.length - 1) {
                i = this.pages.length - 1;
            }
            x = this.pages[i][0].x;
        }
        if (m === this.currentPage.pageY) {
            m += this.directionY;
            if (m < 0) {
                m = 0;
            } else if (m > this.pages[i].length - 1) {
                m = this.pages[i].length - 1;
            }
            y = this.pages[i][m].y;
        }
        return {
            x,
            y,
            pageX: i,
            pageY: m,
        };
    }
    refresh() {
        this.wrapperWidth =
            parseInt(this.wrapper.style.width) || this.wrapper.clientWidth;
        this.wrapperHeight =
            parseInt(this.wrapper.style.height) || this.wrapper.clientHeight;
        this.scrollerWidth =
            parseInt(this.scrollerStyle.width) || this.scroller.clientWidth;
        this.scrollerHeight =
            parseInt(this.scrollerStyle.height) || this.scroller.clientHeight;
        this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
        this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
        this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
        this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;
        if (!this.hasVerticalScroll) {
            this.maxScrollY = 0;
            this.scrollerHeight = this.wrapperHeight;
        }
        if (!this.hasHorizontalScroll) {
            this.maxScrollX = 0;
            this.scrollerWidth = this.wrapperWidth;
        }
        this.endTime = 0; //TODO ???????????????
        this.wrapperOffset = offset(this.wrapper);
        this.trigger("refresh");
        this.resetPosition();
    }
    resetPosition(time = 0, easeing = ease.bounce) {
        let x = this.x;
        if (!this.hasHorizontalScroll || x > 0) {
            x = 0;
        } else if (x < this.maxScrollX) {
            x = this.maxScrollX;
        }
        let y = this.y;
        if (!this.hasVerticalScroll || y > 0) {
            y = 0;
        } else if (y < this.maxScrollY) {
            y = this.maxScrollY;
        }
        if (x === this.x && y === this.y) {
            return false;
        }
        this.scrollTo(x, y, time, easeing);
        return true;
    }
    next(time, easing) {
        let pageX = this.currentPage.pageX;
        const pageY = this.currentPage.pageY;
        pageX += 1;
        if (pageX > this.pages.length - 1) {
            pageX = 0;
        }
        this.goToPage(pageX, pageY, time, easing);
    }
    prev(time, easing) {
        let pageX = this.currentPage.pageX;
        const pageY = this.currentPage.pageY;
        pageX -= 1;
        if (pageX < 0) {
            pageX = this.pages.length - 1;
        }
        this.goToPage(pageX, pageY, time, easing);
    }
    enable() {
        this.enabled = true;
    }
    _init() {
        this.x = 0;
        this.y = 0;
        this._addEvents();
    }
    scrollTo(x, y, time = 0, easing = ease.bounce) {
        this.isTransition =
            this.options.useTransition &&
            time > 0 &&
            (x !== this.x || y !== this.y);
        if (!time || this.options.useTransition) {
            this._transitionTimingFunction(easing.style);
            this._transitionTime(time);
            this._translate(x, y);
        }
    }

    _addEvents() {
        this._handleEvents(addEvent);
    }
    _removeEvents() {
        this._handleEvents(removeEvent);
    }
    _handleEvents(eventOperation) {
        const target = this.options.bindToWrapper ? this.wrapper : window;
        eventOperation(window, "orientationchange", this);
        eventOperation(window, "resize", this);
        if (hasTouch && !this.options.disableTouch) {
            eventOperation(this.wrapper, "touchstart", this);
            eventOperation(target, "touchmove", this);
            eventOperation(target, "touchcancel", this);
            eventOperation(target, "touchend", this);
        }
        eventOperation(this.scroller, style.transitionEnd, this);
    }
    destroy() {
        this._removeEvents();
        this.trigger("destroy");
    }

    handleEvent(e) {
        switch (e.type) {
            case "touchstart":
            case "mousedown":
                this._start(e);
                break;
            case "touchmove":
            case "mousemove":
                this._move(e);
                break;
            case "touchend":
            case "mouseup":
            case "touchcancel":
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
    }

    _start(e) {
        console.log("startEvent", e);
        const _eventType = eventType[e.type];
        if (
            !this.enabled ||
            (this.initiated && this.initiated !== _eventType)
        ) {
            return;
        }
        this.initiated = _eventType;
        if (this.options.preventDefault) {
            e.preventDefault();
        }
        this.moved = false;
        this.distX = 0;
        this.distY = 0;
        this._transitionTime();
        this.startTime = +new Date();
        if (this.options.useTransition && this.isTransition) {
            this.isTransition = false;
            let pos = this.getComputedPosition();
            this._translate(Math.round(pos.x), Math.round(pos.y)); // ???????????????
            this.trigger("scrollEnd");
        }
        let point = e.touches ? e.touches[0] : e;
        this.startX = this.x;
        this.startY = this.y;
        this.absStartX = this.startX;
        this.absStartY = this.startY;
        this.pointX = point.pageX;
        this.pointY = point.pageY;
        this.trigger("beforeScrollStart");
    }
    _move(e) {
        // console.log("moveEvent", e);
        console.log("move=====");
        const _eventType = eventType[e.type];
        if (!this.enabled || this.initiated !== _eventType) {
            return;
        }
        if (this.options.preventDefault) {
            e.preventDefault();
        }
        let point = e.touches ? e.touches[0] : e;
        const pointX = point.pageX;
        const pointY = point.pageY;
        let deltaX = pointX - this.pointX;
        let deltaY = pointY - this.pointY;
        this.pointX = pointX;
        this.pointY = pointY;
        this.distX += deltaX;
        this.distY += deltaY;
        let absDistX = Math.abs(this.distX);
        let absDistY = Math.abs(this.distY);
        const timestamp = +new Date();
        if (
            timestamp - this.startTime > this.options.momentumLimitTime &&
            absDistY < this.options.momentumLimitDistance &&
            absDistX < this.options.momentumLimitDistance
        ) {
            return;
        }
        if (!this.hasVerticalScroll) {
            deltaY = 0;
        }
        if (!this.hasHorizontalScroll) {
            deltaX = 0;
        }
        let newX = this.x + deltaX;
        let newY = this.y + deltaY;
        if (newX > 0 || newX < this.maxScrollX) {
            newX = this.x + deltaX / 3;
        }

        if (newY > 0 || newY < this.maxScrollY) {
            newY = this.y + deltaY / 3;
        }
        if (!this.moved) {
            this.moved = true;
            this.trigger("scrollStart");
        }
        this._translate(newX, newY);
        if (timestamp - this.startTime > this.options.momentumLimitTime) {
            this.startTime = timestamp;
            this.startX = this.x;
            this.startY = this.y;
            if (this.options.probeType === 1) {
                this.trigger("scroll", { x: this.x, y: this.y });
            }
        }
        if (this.options.probeType > 1) {
            this.trigger("scroll", { x: this.x, y: this.y });
        }
        let scrollLeft =
            document.documentElement.scrollLeft ||
            window.pageXOffset ||
            document.body.scrollLeft;
        let scrollTop =
            document.documentElement.scrollTop ||
            window.pageYOffset ||
            document.body.scrollTop;
        const pX = this.pointX - scrollLeft,
            pY = this.pointY - scrollTop;
        if (
            pX >
                document.documentElement.clientWidth -
                    this.options.momentumLimitDistance ||
            pX < this.options.momentumLimitDistance ||
            pY < this.options.momentumLimitDistance ||
            pY >
                document.documentElement.clientHeight -
                    this.options.momentumLimitDistance
        ) {
            this._end(e);
        }
    }

    _end(e) {
        console.log("end=====");
        const _eventType = eventType[e.type];
        if (!this.enabled || this.initiated !== _eventType) {
            return;
        }
        this.initiated = false;

        if (this.options.preventDefault) {
            e.preventDefault();
        }
        // ????????????
        if (this.resetPosition(this.options.bounceTime, ease.bounce)) {
            return;
        }
        this.isTransition = false;
        let newX = Math.round(this.x);
        let newY = Math.round(this.y);
        if (!this.moved) {
            this.trigger("scrollCancel");
            return;
        }
        this.scrollTo(newX, newY);

        let deltaX = newX - this.absStartX;
        let deltaY = newY - this.absStartY;
        this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
        this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

        this.endTime = +new Date();
        let duration = this.endTime - this.startTime;
        let absDistX = Math.abs(newX - this.startX);
        let absDistY = Math.abs(newY - this.startY);
        let time = 0;
        if (
            this.options.momentum &&
            duration < this.options.momentumLimitTime &&
            (absDistY > this.options.momentumLimitDistance ||
                absDistX > this.options.momentumLimitDistance)
        ) {
            let momentumX = this.hasHorizontalScroll
                ? momentum(
                      this.x,
                      this.startX,
                      duration,
                      this.maxScrollX,
                      this.options.bounce ? this.wrapperWidth : 0,
                      this.options
                  )
                : { destination: newX, duration: 0 };
            let momentumY = this.hasVerticalScroll
                ? momentum(
                      this.y,
                      this.startY,
                      duration,
                      this.maxScrollY,
                      this.options.bounce ? this.wrapperHeight : 0,
                      this.options
                  )
                : { destination: newY, duration: 0 };
            newX = momentumX.destination;
            newY = momentumY.destination;
            time = Math.max(momentumY.duration, momentumX.duration);
            this.isTransition = 1; // TODO ????????????1
        }
        let easing = ease.swipe; // ?????????swipe
        if (this.options.snap) {
            let snap = this._nearestSnap(newX, newY);
            console.log("snap=======", snap);
            this.currentPage = snap;
            time =
                this.options.snapSpeed ||
                Math.max(
                    Math.max(
                        Math.min(Math.abs(newX - snap.x), 1000),
                        Math.min(Math.abs(newY - snap.y), 1000)
                    ),
                    300
                );
            newX = snap.x;
            newY = snap.y;
            this.directionX = 0;
            this.directionY = 0;
            easing = ease.bounce;
        }
        if (newY !== this.y || newX !== this.x) {
            if (
                newX > 0 ||
                newY > 0 ||
                newX < this.maxScrollX ||
                newY < this.maxScrollY
            ) {
                easing = ease.swipeBounce;
            }
            this.scrollTo(newX, newY, time, easing);
            return; //???transitionEnd?????????scrollend??????
        }
        this.trigger("scrollEnd");
    }
    _resize() {}
    getComputedPosition() {
        let matrix = window.getComputedStyle(this.scroller, null);
        let x;
        let y;

        if (this.options.useTransform) {
            matrix = matrix[style.transform].split(")")[0].split(", ");
            x = +(matrix[12] || matrix[4]);
            y = +(matrix[13] || matrix[5]);
        } else {
            x = +matrix.left.replace(/[^-\d.]/g, "");
            y = +matrix.top.replace(/[^-\d.]/g, "");
        }

        return {
            x,
            y,
        };
    }
    _transitionTime(time = 0) {
        this.scrollerStyle[style.transitionDuration] = time + "ms";
    }
    _transitionTimingFunction(easing) {
        this.scrollerStyle[style.transitionTimingFunction] = easing;
    }
    _translate(x, y) {
        if (this.options.useTransition) {
            this.scrollerStyle[style.transform] =
                "translate(" + x + "px," + y + "px)" + this.translateZ;
        }
        this.x = x;
        this.y = y;
    }
    _transitionEnd(e) {
        if (e.target !== this.scroller || !this.isTransition) {
            return;
        }
        this._transitionTime();
        if (!this.resetPosition(this.options.bounceTime, ease.bounce)) {
            this.isTransition = false;
            this.trigger("scrollEnd");
        }
    }
}
