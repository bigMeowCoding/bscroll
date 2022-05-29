export default class EventEmitter {
  constructor() {
    this._events = {};
  }
  on(type, fn, context = this) {
    if (!this._events[type]) {
      this._events[type] = [];
    }
    this._events[type].push([fn, context]);
  }
  off(type, fn) {
    if (!this._events[type]) {
      return;
    }
    this._events[type] = this._events[type].filter((e) => {
      const [callback] = e;
      return callback !== fn;
    });
  }
  once(type, fun, context = this) {
    let fired = false;
    const callback = (...args) => {
      this.off(type, callback);
      if (!fired) {
        return fun.apply(context, [...args]);
      }
      fired = true;
    };
    this.on(type, callback);
  }
  trigger(type, ...args) {
    if (!this._events[type]) {
      return;
    }
    const events = [...this._events[type]];
    events.forEach((event) => {
      const [fn, context] = event;
      fn.apply(context, Array.from(args));
    });
  }
}
