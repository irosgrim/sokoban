const cc = {
  2: 0,
  3: 7,
  1: 4,
};

let timeout;

const debounce = (func, delay) => {
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

class Board {
  constructor(canvasWidth, canvasHeight, blockSize) {
    this.blockSize = blockSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }
  grid(context) {
    context.lineWidth = 1;
    for (let x = 0; x < this.canvasWidth; x += this.blockSize) {
      context.beginPath();
      context.strokeStyle = "#ababab";
      context.moveTo(x, 0);
      context.lineTo(x, this.canvasHeight);
      context.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += this.blockSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(this.canvasWidth, y);
      context.stroke();
    }
  }
  draw(context) {
    this.grid(context);
  }
}

class EditorMenu {
  constructor(sprite, canvas, ctx, config) {
    this.sprite = sprite;
    this.canvas = canvas;
    this.context = ctx;
    this.config = config;
    this.menuItems = [];
  }

  draw() {
    const spriteElements = [
      { type: "delete", spritePosition: [0, 0], value: 0 },
      { type: "crate", spritePosition: [0, 2], value: 2 },
      { type: "obstacle", spritePosition: [0, 1], value: 1 },
      { type: "target", spritePosition: [0, 3], value: 3 },
      { type: "player", spritePosition: [0, 4], value: 4 },
    ];
    //image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
    for (let i = 0; i < spriteElements.length; i++) {
      const { spritePosition } = spriteElements[i];
      this.context.drawImage(
        this.sprite,
        spritePosition[1] * CONFIG.spriteSize,
        spritePosition[0] * CONFIG.spriteSize,
        CONFIG.spriteSize,
        CONFIG.spriteSize,
        CONFIG.blockSize * i,
        0,
        CONFIG.blockSize,
        CONFIG.blockSize,
      );

      this.menuItems.push(spriteElements[i]);
    }
    this.context.drawImage(
      menuSprite,
      4 * CONFIG.spriteSize,
      0,
      3 * CONFIG.spriteSize,
      CONFIG.spriteSize,
      CONFIG.blockSize * 13,
      0,
      3 * CONFIG.blockSize,
      CONFIG.blockSize,
    );
  }
}

class Editor {
  constructor(eventManager, canvas, ctx, menu, sprite, customLevel) {
    this.eventManager = eventManager;
    this.canvas = canvas;
    this.context = ctx;
    this.menu = menu;
    this.sprite = sprite;
    this.isMouseDown = false;
    this.choice = { type: "obstacle", spritePosition: [0, 4], value: 1 };
    this.maLevel = [];
    if (customLevel) {
      const level = JSON.parse(atob(customLevel));
      this.maLevel = level;
    } else {
      this.maLevel = Array.from({ length: 16 }, () =>
        Array.from({ length: 16 }).fill(0),
      );
    }
  }

  getPosition(e, canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    let x, y;

    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    x *= canvasEl.width / rect.width;
    y *= canvasEl.height / rect.height;

    const col = Math.floor(x / CONFIG.blockSize);
    const row = Math.floor(y / CONFIG.blockSize);

    return [col, row];
  }

  paint(data) {
    const { position, choice } = data;

    if (choice.value === 4) {
      for (let y = 0; y < this.maLevel.length; y++) {
        for (let x = 0; x < this.maLevel[y].length; x++) {
          if (this.maLevel[y][x] === 4) {
            this.maLevel[y][x] = 0;
          }
        }
      }
      this.maLevel[position[1]][position[0]] = 4;
    } else {
      this.maLevel[position[1]][position[0]] = choice.value;
    }

    this.draw();
  }

  draw() {
    for (let y = 0; y < this.maLevel.length; y++) {
      for (let x = 0; x < this.maLevel[y].length; x++) {
        // reset bg
        this.context.drawImage(
          this.sprite,
          0,
          0,
          CONFIG.spriteSize,
          CONFIG.spriteSize,
          x * CONFIG.blockSize,
          y * CONFIG.blockSize,
          CONFIG.blockSize,
          CONFIG.blockSize,
        );
        this.context.drawImage(
          this.sprite,
          this.maLevel[y][x] * CONFIG.spriteSize,
          0,
          CONFIG.spriteSize,
          CONFIG.spriteSize,
          x * CONFIG.blockSize,
          y * CONFIG.blockSize,
          CONFIG.blockSize,
          CONFIG.blockSize,
        );
      }
    }
  }
}

class EditorEvents extends Editor {
  constructor(eventManager, canvas, ctx, menu, sprite, customLevel) {
    super(eventManager, canvas, ctx, menu, sprite, customLevel);
    this.isMouseDown = false;
    this.menu.canvas.addEventListener("mouseup", this.menuOnMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.editorOnMouseMove);
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));

    this.menu.canvas.addEventListener(
      "touchend",
      this.menuOnMouseUp.bind(this),
    );
    this.canvas.addEventListener("touchmove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this));
    this.canvas.addEventListener("touchend", this.onMouseUp.bind(this));

    this.eventManager.listen("grid:paint", (data) => this.paint(data));
  }

  onMouseMove(e) {
    const [x, y] = this.getPosition(e, this.canvas);

    if (this.isMouseDown && this.choice) {
      this.eventManager.broadcast("grid:paint", {
        position: [x, y],
        choice: this.choice,
      });
    }
  }

  menuOnMouseUp(e) {
    this.isMouseDown = false;
    const [x, y] = this.getPosition(e, this.menu.canvas);
    if (x <= this.menu.menuItems.length) {
      this.choice = this.menu.menuItems[x];
    }
    if (x === 13) {
      this.eventManager.broadcast("editor:save", { level: this.maLevel });
    }
    if (x === 14) {
      this.eventManager.broadcast("editor:download", { level: this.maLevel });
    }
  }

  onMouseUp(e) {
    this.isMouseDown = false;
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    const [x, y] = this.getPosition(e, this.canvas);
  }
}
