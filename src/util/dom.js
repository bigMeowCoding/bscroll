export function addEvent(el, type, fn, capture) {
  el.addEventListener(type, fn, !!capture);
}
export function removeEvent(el, type, fn, capture) {
  el.removeEventListener(type, fn, !!capture);
}
const elStyle = document.createElement("div").style;
const vendor = (function () {
  let transformNames = {
    webkit: "webkitTransform",
    Moz: "MozTransform",
    O: "OTransform",
    ms: "msTransform",
    standard: "transform",
  };
  for (let k of Object.keys(transformNames)) {
    if (elStyle[transformNames[k]] !== undefined) {
      return k;
    }
  }
  return false;
})();
export function prefixStyle(style) {
  if (vendor === false) {
    return false;
  }
  if (vendor === "standard") {
    return style;
  }
  return vendor + style.charAt(0).toUpperCase() + style.slice(1);
}

let transform = prefixStyle("transform");
export const hasTouch = "ontouchstart" in window;

export const style = {
  transform,
  transitionTimingFunction: prefixStyle("transitionTimingFunction"),
  transitionDuration: prefixStyle("transitionDuration"),
  transitionDelay: prefixStyle("transitionDelay"),
  transformOrigin: prefixStyle("transformOrigin"),
  transitionEnd: prefixStyle("transitionEnd"),
};
export const hasPerspective = prefixStyle("perspective") in elStyle;

const TOUCH_EVENT = 1;
const MOUSE_EVENT = 2;
export const eventType = {
  touchstart: TOUCH_EVENT,
  touchmove: TOUCH_EVENT,
  touchend: TOUCH_EVENT,

  mousedown: MOUSE_EVENT,
  mousemove: MOUSE_EVENT,
  mouseup: MOUSE_EVENT,
};
export function offset(el) {
  let left, top;
  while (el) {
    left -= el.offsetLeft; // TODO 不明白为什么用-
    top -= el.offsetTop;
    el = el.offsetParent;
  }
  return {
    left,
    top,
  };
}
