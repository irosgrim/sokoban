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
    wrappedCallback.originalCallback = callback; // Store the original callback

    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }

    this.listeners[topic].push(wrappedCallback);
    this.addEventListener(topic, wrappedCallback);

    return wrappedCallback;
  }

  remove(topic, originalCallback) {
    const wrappedCallbacks = this.listeners[topic] || [];
    for (let i = 0; i < wrappedCallbacks.length; i++) {
      const wrappedCallback = wrappedCallbacks[i];
      // Assuming wrappedCallback was storing the original callback as a property
      if (wrappedCallback.originalCallback === originalCallback) {
        this.removeEventListener(topic, wrappedCallback);
        this.listeners[topic].splice(i, 1);
        break;
      }
    }
  }

  removeAll(topic) {
    const wrappedCallbacks = this.listeners[topic] || [];
    for (const wrappedCallback of wrappedCallbacks) {
      this.removeEventListener(topic, wrappedCallback);
    }
    this.listeners[topic] = [];
  }
}
