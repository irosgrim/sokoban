// class EventManager {
//   constructor() {
//     this.listeners = {};
//   }

//   on(event, callback) {
//     if (!this.listeners[event]) {
//       this.listeners[event] = [];
//     }
//     this.listeners[event].push(callback);
//   }

//   emit(event, data) {
//     if (this.listeners[event]) {
//       for (let callback of this.listeners[event]) {
//         callback(data);
//       }
//     }
//   }
// }

class EventManager extends EventTarget {
  constructor() {
    super();
    this.listeners = {};
  }

  broadcast(topic, data) {
    const customEvent = new CustomEvent(topic, { detail: data });
    this.dispatchEvent(customEvent);
  }

  listen(topic, callback) {
    const wrappedCallback = (event) => callback(event.detail);

    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }
    this.listeners[topic].push(wrappedCallback);

    this.addEventListener(topic, wrappedCallback);
    // needed to be able to remove the listener
    return wrappedCallback;
  }

  remove(topic, wrappedCallback) {
    this.removeEventListener(topic, wrappedCallback);
  }

  removeAll() {
    for (const [topic, callbacks] of Object.entries(this.listeners)) {
      for (const wrappedCallback of callbacks) {
        this.removeEventListener(topic, wrappedCallback);
      }
    }
    this.listeners = {};
  }
}
