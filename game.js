const blockType = {
  0: null,
  1: {
    fillStyle: "blue",
    strokeStyle: "gray",
    lineWidth: 6,
    type: "obstacle",
  },
  2: {
    fillStyle: "yellow",
    strokeStyle: "brown",
    lineWidth: 6,
    type: "crate",
  },
  3: {
    fillStyle: "green",
    strokeStyle: "green",
    lineWidth: 6,
    type: "target",
  },
  4: {
    fillStyle: "white",
    strokeStyle: "black",
    lineWidth: 6,
    type: "player",
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
  ) {
    this.ctx = ctx;
    this.targetsLeft = 0;
    this.blockSize = blockSize;
    this.rows = rows;
    this.columns = columns;
    this.blocks = [];
    this.player = null;
    this.canvas = canvasElement;
    this.bg = new Bg(columns * blockSize, rows * blockSize, blockSize);
    this.board = new Board(columns * blockSize, rows * blockSize, blockSize);
    this.eventManager = eventManager;
    this.makeBlocks(blocks);
    this.eventManager.on(
      "direction:change",
      this.handleDirectionChange.bind(this),
    );
    this.eventManager.on("block:move", this.handleBlockMoved.bind(this));
    this.txt = document.getElementById("targets");
  }

  handleBlockMoved(data) {
    const { block } = data;
    let wasOnTarget = block.isOnTarget || false;
    for (const bl of this.blocks) {
      if (bl.props.type === "target") {
        if (bl.x === block.x && bl.y === block.y) {
          block.props.fillStyle = "red";
          block.props.strokeStyle = "red";
          block.isOnTarget = true;

          if (!wasOnTarget) {
            this.targetsLeft--;
            this.eventManager.emit("targets", this.targetsLeft);
          }
          return;
        }
      }
    }

    if (wasOnTarget) {
      block.props.fillStyle = blockType[2].fillStyle;
      block.props.strokeStyle = blockType[2].strokeStyle;
      block.isOnTarget = false;

      this.targetsLeft++;
      this.eventManager.emit("targets", this.targetsLeft);
    }
  }
  handleDirectionChange(direction) {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.movePlayer(direction);
    this.draw(this.ctx);
  }

  draw(context) {
    this.bg.draw(context);
    for (const block of this.blocks) {
      block.draw(context);
    }
    this.player.draw(context);
    this.board.draw(context);
  }

  makeBlocks(blocks) {
    for (let y = 0; y < blocks.length; y++) {
      for (let x = 0; x < blocks[y].length; x++) {
        if (blockType[blocks[y][x]]) {
          if (blockType[blocks[y][x]].type === "target") {
            this.targetsLeft += 1;
            this.eventManager.emit("targets", this.targetsLeft);
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
              this.player = new MovableBlock(this.eventManager, {
                ...blockConfig,
                zIndex: 4,
              });
              break;
            case "crate":
              this.blocks.push(
                new MovableBlock(this.eventManager, {
                  ...blockConfig,
                  zIndex: 2,
                }),
              );
              break;
            default:
              this.blocks.push(
                new Block(this.eventManager, { ...blockConfig, zIndex: 3 }),
              );
              break;
          }
        }
      }
    }
    this.blocks.sort((a, b) => a.zIndex - b.zIndex);
  }

  movePlayer(direction) {
    this.eventManager.emit("player:move", { direction, blocks: this.blocks });
  }
}

class Bg {
  constructor(canvasWidth, canvasHeight, blockSize){
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.blockSize = blockSize;
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
            },
          };
    return new Block(null, { ...blockConfig, zIndex: 0 });
  }
  draw (context) {
    for (let y = 0; y < this.canvasHeight; y += this.blockSize) {
      for (let x = 0; x < this.canvasWidth; x += this.blockSize) {
        console.log({x, y})
        this.bgBlock(x, y).draw(context);
      }
    }
  }
}

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
      context.strokeStyle = "#d3d3d3";
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

