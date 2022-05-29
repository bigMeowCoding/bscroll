export function addEvent(el, type, fn, capture) {
  el.addEventListener(type, fn, !!capture);
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

export const style = {
  transform,
  transitionTimingFunction: prefixStyle("transitionTimingFunction"),
  transitionDuration: prefixStyle("transitionDuration"),
  transitionDelay: prefixStyle("transitionDelay"),
  transformOrigin: prefixStyle("transformOrigin"),
  transitionEnd: prefixStyle("transitionEnd"),
};
