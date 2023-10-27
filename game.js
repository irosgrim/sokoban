const blockType = {
  0: null,
  1: {
    fillStyle: "blue",
    strokeStyle: "gray",
    lineWidth: 6,
    type: "obstacle",
    bg: 1,
  },
  2: {
    fillStyle: "yellow",
    strokeStyle: "brown",
    lineWidth: 6,
    type: "crate",
    bg: 2,
  },
  3: {
    fillStyle: "green",
    strokeStyle: "green",
    lineWidth: 6,
    type: "target",
    bg: 3,
  },
  4: {
    fillStyle: "white",
    strokeStyle: "black",
    lineWidth: 6,
    type: "player",
    bg: 4,
  },
};

class Game {
  constructor(
    blocks,
    rows,
    columns,
    blockSize,
    canvasElement,
    ctx,
    eventManager,
    sprite,
  ) {
    this.ctx = ctx;
    this.targetsLeft = 0;
    this.distanceWalked = 0;
    this.blockSize = blockSize;
    this.rows = rows;
    this.columns = columns;
    this.blocks = [];
    this.player = null;
    this.canvas = canvasElement;
    this.bg = new Bg(columns * blockSize, rows * blockSize, blockSize, sprite);
    this.board = new Board(columns * blockSize, rows * blockSize, blockSize);
    this.eventManager = eventManager;
    this.sprite = sprite;
    this.makeBlocks(blocks);
    this.eventManager.listen("level:new", this.resetLevel.bind(this));
    this.eventManager.listen(
      "player:step",
      this.handleDistanceWalked.bind(this),
    );
    this.eventManager.listen(
      "direction:change",
      this.handleDirectionChange.bind(this),
    );
    this.eventManager.listen("block:move", this.handleBlockMoved.bind(this));
    this.txt = document.getElementById("targets");
    this.draw(this.ctx);
  }

  resetLevel(l) {
    this.targetsLeft = 0;
    this.distanceWalked = 0;
    this.blocks = [];
    this.player = null;
    // remove all player event listeners
    this.eventManager.removeAll("player:move");
    this.makeBlocks(l);
    this.draw(this.ctx);
  }

  handleDistanceWalked(d) {
    this.distanceWalked += d;
    this.eventManager.broadcast("distance-walked", this.distanceWalked);
  }

  handleBlockMoved(data) {
    const { block } = data;
    let wasOnTarget = block.isOnTarget || false;
    for (const bl of this.blocks) {
      if (bl.props.type === "target") {
        if (bl.x === block.x && bl.y === block.y) {
          block.props.bg = 2;
          block.props.strokeStyle = "red";
          block.isOnTarget = true;

          if (!wasOnTarget) {
            this.targetsLeft--;
            this.eventManager.broadcast("targets", this.targetsLeft);
            if (!this.targetsLeft) {
              this.showEndMenu();
            }
          }
          return;
        }
      }
    }

    if (wasOnTarget) {
      block.props.bg = 2;
      block.props.fillStyle = blockType[2].fillStyle;
      block.props.strokeStyle = blockType[2].strokeStyle;
      block.isOnTarget = false;

      this.targetsLeft++;
      this.eventManager.broadcast("targets", this.targetsLeft);
    }
  }
  handleDirectionChange(direction) {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.movePlayer(direction);
    this.draw(this.ctx);
  }

  draw(context) {
    this.clearCanvas();
    this.bg.draw(context);
    for (const block of this.blocks) {
      block.draw(context);
    }
    this.player.draw(context);
  }

  makeBlocks(blocks) {
    for (let y = 0; y < blocks.length; y++) {
      for (let x = 0; x < blocks[y].length; x++) {
        if (blockType[blocks[y][x]]) {
          if (blockType[blocks[y][x]].type === "target") {
            this.targetsLeft += 1;
            this.eventManager.broadcast("targets", this.targetsLeft);
          }
          let blockConfig = {
            x: x * this.blockSize,
            y: y * this.blockSize,
            width: this.blockSize,
            height: this.blockSize,
            props: { ...blockType[blocks[y][x]] },
          };

          switch (blockConfig.props.type) {
            case "player":
              this.player = new MovableBlock(
                this.eventManager,
                {
                  ...blockConfig,
                  zIndex: 4,
                },
                this.sprite,
              );
              break;
            case "crate":
              this.blocks.push(
                new MovableBlock(
                  this.eventManager,
                  {
                    ...blockConfig,
                    zIndex: 4,
                  },
                  this.sprite,
                ),
              );
              break;
            default:
              this.blocks.push(
                new Block(
                  this.eventManager,
                  { ...blockConfig, zIndex: 3 },
                  this.sprite,
                ),
              );
              break;
          }
        }
      }
    }
    this.blocks.sort((a, b) => a.zIndex - b.zIndex);
  }

  movePlayer(direction) {
    this.eventManager.broadcast("player:move", {
      direction,
      blocks: this.blocks,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
    });
  }

  showEndMenu() {
    // this.context.fillRect(0 + 100, 0+100, 100, 100);
    console.log("DONE");
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class Bg {
  constructor(canvasWidth, canvasHeight, blockSize, sprite) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.blockSize = blockSize;
    this.sprite = sprite;
  }
  bgBlock(x, y) {
    const blockConfig = {
      x: x,
      y: y,
      width: this.blockSize,
      height: this.blockSize,
      props: {
        fillStyle: "#b1f292",
        strokeStyle: "#b1f292",
        lineWidth: 6,
        type: "bg",
        bg: 0,
      },
    };
    return new Block(null, { ...blockConfig, zIndex: 0 }, this.sprite);
  }
  draw(context) {
    for (let y = 0; y < this.canvasHeight; y += this.blockSize) {
      for (let x = 0; x < this.canvasWidth; x += this.blockSize) {
        this.bgBlock(x, y).draw(context);
      }
    }
  }
}

const fetchGameLevel = async (lvl = { currentLevel: 1, next: 0 }) => {
  const curr = lvl.currentLevel + lvl.next;
  const req = await fetch(`./map${curr}.json`);

  if (req.ok) {
    return req.json();
  } else {
    throw new Error("Failed to load level. Maybe no more levels!");
  }
};

class GameMenu {
  constructor(rows, columns, blockSize, canvas, ctx, eventManager, menuSprite) {
    this.currLevel = 1;
    this.rows = rows;
    this.columns = columns;
    this.blockSize = blockSize;
    this.canvas = canvas;
    this.ctx = ctx;
    this.distanceWalked = 0;
    this.targetsLeft = 0;
    this.eventManager = eventManager;
    this.menuSprite = menuSprite;
    this.eventManager.listen("targets", (t) => {
      this.targetsLeft = t;
      this.draw();
    });
    this.eventManager.listen("distance-walked", (d) => {
      this.distanceWalked = d;
      this.draw();
    });
    this.canvas.addEventListener("mouseup", this.menuOnMouseUp.bind(this));
    this.canvas.addEventListener("touchend", this.menuOnMouseUp.bind(this));
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.menuSprite, 0, 0, 120, 40, 40 * 10, 0, 120, 40);

    this.ctx.drawImage(this.menuSprite, 120, 0, 40, 40, 40 * 14, 0, 40, 40);
    this.ctx.drawImage(this.menuSprite, 160, 0, 40, 40, 40 * 15, 0, 40, 40);

    // help icon
    // this.ctx.drawImage(this.menuSprite, 240, 0, 40, 40, 40 * 15, 0, 40, 40);

    this.ctx.font = "22px courier";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(`Targets: ${this.targetsLeft}`, 10, 28);
    this.ctx.fillText(`Distance: ${this.distanceWalked}`, 170, 28);

    this.ctx.fillText(
      `${this.currLevel < 10 ? "0" + this.currLevel : this.currLevel}`,
      528,
      28,
    );
  }

  getPosition(e, canvasEl) {
    const { scale, blockSize } = CONFIG;
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

    // scale the blockSize to match the scaled canvas
    const scaledBlockSize = (blockSize * scale) / 2;

    const col = Math.floor(x / scaledBlockSize);
    const row = Math.floor(y / scaledBlockSize);

    return [col, row];
  }

  menuOnMouseUp(e) {
    const [x, y] = this.getPosition(e, this.canvas);
    const url = new URL(window.location.href);
    const customLevel = url.searchParams.get("level");

    switch (x) {
      case 10:
        if (customLevel) {
          window.location.reload();
        } else {
          fetchGameLevel({ currentLevel: this.currLevel, next: 0 })
            .then((l) => {
              this.eventManager.broadcast("level:new", l);
              this.distanceWalked = 0;
              this.draw();
            })
            .catch((err) => console.log(err));
        }

        break;
      case 12:
        {
          if (customLevel) {
            url.searchParams.delete("level");
            window.history.replaceState({}, document.title, url);
          }
          const lvl = { currentLevel: this.currLevel, next: -1 };
          if (lvl.next === -1 && lvl.currentLevel === 1) {
            console.log("Already at the first level. Can't go back.");
            return null;
          }
          fetchGameLevel(lvl)
            .then((l) => {
              this.eventManager.broadcast("level:new", l);
              this.currLevel--;
              this.distanceWalked = 0;
              this.draw();
            })
            .catch((err) => console.log(err));
        }
        break;
      case 14:
        {
          if (customLevel) {
            url.searchParams.delete("level");
            window.history.replaceState({}, document.title, url);
          }
          const lvl = { currentLevel: this.currLevel, next: 1 };
          fetchGameLevel(lvl)
            .then((l) => {
              this.eventManager.broadcast("level:new", l);
              this.currLevel++;
              this.distanceWalked = 0;
              this.draw();
            })
            .catch((err) => console.log(err));
        }
        break;
      case 15:
        const params = new URLSearchParams(window.location.search);
        params.set("editor", true);
        const newUrl = `${window.location.protocol}//${window.location.host}${
          window.location.pathname
        }?${params.toString()}`;
        window.location.href = newUrl;
        break;
    }
  }
}
