const MAX_LISTENER_EXCEEDED_WARN_MESSAGE = '同一事件订阅函数超出上限警告';

class PowerEmitter {
  #eventPool = {};
  #defaultMaxListeners;
  // #privateMethod () {}

  static defaultMaxListeners = 10;
  constructor () {
    if (!new.target) {
      throw new Error('PowerEmitter 是构造函数，必须通过 new 操作符调用!');
    }
    this.on('error', function (e) {
      console.error(e);
    });

    this.#defaultMaxListeners = new.target.defaultMaxListeners;
  }

  on (eventName, listener) {
    // 触发默认事件
    this.emit('newListener', eventName, listener);

    if (!#eventPool[eventName]) {
      this.#eventPool[eventName] = [];
    }
    this.#eventPool[eventName].push(listener);

    if (this.defaultMaxListeners !== Infinity || this.defaultMaxListeners !== 0) {
      if (this.#eventPool[eventName].length > this.defaultMaxListeners) {
        console.warn(
          `${MAX_LISTENER_EXCEEDED_WARN_MESSAGE}：${eventName}事件已被订阅${this.#eventPool[eventName].length}次，`,
          `当前事件订阅警告上限为${this.defaultMaxListeners}`);

      }
    }
  }

  prependListener (eventName, listener) {
    // 触发默认事件
    this.emit('newListener', eventName, listener);

    if (!#eventPool[eventName]) {
      this.#eventPool[eventName] = [];
    }
    this.#eventPool[eventName].unshift(listener);
  }

  prependOnceListener (eventName, listener) {
    // 触发默认事件
    this.emit('newListener', eventName, listener);

    this.prependListener(eventName, (...rest) => {
      listener.call(this, ...rest);
      this.removeEventListener(eventName, listener);
    });
  }

  once (eventName, listener) {
    const self = this;
    this.on(eventName, function proxyFn(...rest) {
      listener.call(self, ...rest);
      self.removeEventListener(eventName, proxyFn);
    })
  }

  emit (eventName, ...rest) {
    try {
      if (!this.#eventPool[eventName]) {
        return;
      }
      this.#eventPool[eventName].forEach(item => item(...rest));
    } catch (e) {
      this.emit('error', e);
    }
  }

  removeEventListener (eventName, listener) {
    const index = this.#eventPool[eventName].findIndex(item => item === listener);
    this.#eventPool[eventName].splice(index, 1);

    // 触发默认事件
    this.emit('removeListener')
  }

  removeAllListeners (eventName) {
    if (eventName) {
      this.#eventPool[eventName].length = 0
    } else {
      this.#eventPool = {};
    }

    return this;
  }

  eventNames () {
    return Object.getOwnPropertyNames(this.#eventPool).concat(Object.getOwnPropertySymbols(this.#eventPool));
  }

  getMaxListeners () {
    return this.#defaultMaxListeners;
  }

  listenerCount (eventName) {
    return this.#eventPool[eventName].length;
  }

  listeners (eventName) {
    return this.#eventPool[eventName].slice(0);
  }

  setMaxListeners (n) {
    this.#defaultMaxListeners = n;

    return this;
  }
}

const PowerEmitter = (function () {
  if (typeof process && "function" === typeof require) {
    return require('events');
  }
  return PowerEmitter;
})();
