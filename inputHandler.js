class InputHandler {
  constructor(eventManager) {
    this.eventManager = eventManager;
    window.addEventListener("keydown", (e) => {
      e.preventDefault();
      if (e.key.includes("Arrow")) {
        this.changeDirection(e.key);
      }
    });
  }

  changeDirection(key) {
    const directions = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    if (directions[key]) {
      let allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (allowedKeys.includes(key)) {
        this.eventManager.emit("direction:change", directions[key]);
      }
    }
  }
}