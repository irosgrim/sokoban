const cc = {
  2: 0,
  3: 7,
  1: 4,
};

let timeout;

const debounce = (func, delay) => {
  return function() {
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
      {type: "delete", spritePosition: [0, 0], value: 0},
      {type: "crate", spritePosition: [0,2], value: 2},
      {type: "obstacle", spritePosition: [0, 1], value: 1},
      // {type: "bg", spritePosition: [0, 5], value: 0},
      {type: "target", spritePosition: [0, 3], value: 3},
      {type: "player", spritePosition: [0, 4], value: 4},
    ];
    //image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
    for (let i=0; i < spriteElements.length; i++) {
      const {type, spritePosition} = spriteElements[i];
      // if (type !== "delete") {
        this.context.drawImage(
          this.sprite,
          spritePosition[1] * this.config.blockSize,
          spritePosition[0] * this.config.blockSize,
          this.config.blockSize,
          this.config.blockSize,
          this.config.blockSize * i,
          0,
          this.config.blockSize,
          this.config.blockSize,
        );
        // } else {
        //   this.context.fillText("Erase", this.config.blockSize * i +8, this.config.blockSize/2 + 4);
        //   this.context.lineWidth = 3;
        //   this.context.strokeStyle = "red",
        //   this.context.rect(this.config.blockSize * i, 0, this.config.blockSize, this.config.blockSize);
        //   this.context.stroke()
        // }

        this.menuItems.push(spriteElements[i]);
    }
    this.context.fillText("Save", this.config.blockSize * 15 +8, this.config.blockSize/2 + 4);
    this.context.lineWidth = 3;
    this.context.strokeStyle = "red",
    this.context.rect(this.config.blockSize * 15, 0, this.config.blockSize, this.config.blockSize);
    this.context.stroke()
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
    this.choice = {type: "obstacle", spritePosition: [0, 4], value: 1};
    this.maLevel = [];
    if (customLevel) {
      const level = JSON.parse(atob(customLevel));
      console.log(level)
      this.maLevel = level
    } else {
      this.maLevel = Array.from({ length: 16 }, () => Array.from({ length: 16 }).fill(0));
    }
  }

  getPosition (e, canvasEl) {
    const { scale, blockSize } = CONFIG;
    const rect = canvasEl.getBoundingClientRect();
    
    // scale the mouse coordinates to match the scaled canvas
    const x = (e.clientX - rect.left) * (canvasEl.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasEl.height / rect.height);
    
    // scale the blockSize to match the scaled canvas
    const scaledBlockSize = blockSize * scale / 2;
    
    const col = Math.floor(x / scaledBlockSize);
    const row = Math.floor(y / scaledBlockSize);
    
    return [col, row];
  }

  paint (data) {
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


  draw () {
    for (let y = 0; y < this.maLevel.length; y++) {
        for (let x = 0; x < this.maLevel[y].length; x++) {
          let blockConfig = {
              x: this.maLevel[y][x] * 40,
              y: 0,
              width: 40,
              height: 40,
            };
            // reset bg
            this.context.drawImage(
              this.sprite,
              0,
              0,
              blockConfig.width,
              blockConfig.height,
              x * 40,
              y * 40,
              blockConfig.width,
              blockConfig.height,
            );
            this.context.drawImage(
              this.sprite,
              blockConfig.x,
              blockConfig.y,
              blockConfig.width,
              blockConfig.height,
              x * 40,
              y * 40,
              blockConfig.width,
              blockConfig.height,
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
      this.eventManager.listen("grid:paint", (data) => this.paint(data));
      this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
      this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
      this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
  }
 
  onMouseMove(e) {
    const [x, y] = this.getPosition(e, this.canvas);
    
    if (this.isMouseDown && this.choice) {
      this.eventManager.broadcast("grid:paint", {position: [x,y], choice: this.choice});
    }
  }

  menuOnMouseUp (e) {
    this.isMouseDown = false;
    const [x, y] = this.getPosition(e, this.menu.canvas);
    if (x <= this.menu.menuItems.length) {
      this.choice = this.menu.menuItems[x];
      console.log(this.choice)
    }
    if (x === 15) {
      this.eventManager.broadcast("editor:save", {level: this.maLevel});
    }
  }

  onMouseUp (e) {
    this.isMouseDown = false;
  }

  onMouseDown (e) {
    this.isMouseDown = true;
    const [x, y] = this.getPosition(e, this.canvas);
  }

}