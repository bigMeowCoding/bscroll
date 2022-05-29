import EventEmitter from "../util/eventEmitter";
import {
  addEvent,
  eventType,
  extend,
  hasPerspective,
  hasTouch,
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
      this.options.HWCompositing && hasPerspective ? " translateZ(0)" : "";
    this._init();
    this.refresh();
    this.enable();
  }
  refresh() {}
  enable() {
    this.enabled = true;
  }
  _init() {
    this.x = 0;
    this.y = 0;
    this._addEvents();
  }
  scrollTo() {}

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
    console.log(e);
    const _eventType = eventType[e.type];
    if (!this.enabled || (this.initiated && this.initiated !== _eventType)) {
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
      this.isTransition = true;
      let pos = this.getComputedPosition();
      this._translate(Math.round(pos.x), Math.round(pos.y)); // 要四舍五入
      this.trigger("scrollEnd");
    }
    let point = e.touches ? e.touches[0] : e;
    this.startX = this.x;
    this.startY = this.y;
    this.absStartX = Math.abs(this.startX);
    this.absStartY = Math.abs(this.startY);
    this.pointX = point.pageX;
    this.pointY = point.pageY;
    this.trigger("beforeScrollStart");
  }

  _end(e) {}

  _move(e) {}
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
    this.scroller[style.transitionDuration] = time + "ms";
  }
  _translate(x, y) {
    if (this.options.useTransition) {
      this.scrollerStyle[style.transform] =
        "translate(" + x + "px," + y + "px)" + this.translateZ;
    }
    this.x = x;
    this.y = y;
  }
  _transitionEnd(e) {}
}
