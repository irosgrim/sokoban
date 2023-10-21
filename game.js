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

class EventManager {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (let callback of this.listeners[event]) {
        callback(data);
      }
    }
  }
}

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
    this.board = new Board(this, columns * blockSize, rows * blockSize);
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

          if (blockConfig.props.type === "player") {
            this.player = new MovableBlock(this.eventManager, {
              ...blockConfig,
              zIndex: 4,
            });
          } else if (blockConfig.props.type === "crate") {
            this.blocks.push(
              new MovableBlock(this.eventManager, {
                ...blockConfig,
                zIndex: 2,
              }),
            );
          } else {
            this.blocks.push(
              new Block(this.eventManager, { ...blockConfig, zIndex: 3 }),
            );
          }
        }
      }
    }
    this.blocks.sort((a, b) => a.zIndex - b.zIndex);
    console.log(this.blocks);
  }

  movePlayer(direction) {
    this.eventManager.emit("player:move", { direction, blocks: this.blocks });
  }
}

class Block {
  constructor(eventManager, block) {
    this.eventManager = eventManager;
    this.x = block.x;
    this.y = block.y;
    this.height = block.height;
    this.width = block.width;
    this.props = block.props;
    this.zIndex = block.zIndex;
    this.isOnTarget = false;
  }

  draw(context) {
    context.fillStyle = this.props.fillStyle;
    context.strokeStyle = this.props.strokeStyle;
    context.lineWidth = 6;
    if (this.props.type === "target") {
      context.beginPath();
      context.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.height / 2 - 6,
        0,
        Math.PI * 2,
        true,
      );
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = "#003300";
      context.stroke();
    } else {
      context.fillRect(
        this.x + 6,
        this.y + 6,
        this.height - 12,
        this.width - 12,
      );
      context.strokeRect(
        this.x + 3,
        this.y + 3,
        this.height - 6,
        this.width - 6,
      );
    }
  }
}

class MovableBlock extends Block {
  constructor(eventManager, block) {
    super(eventManager, block);
    this.eventManager = eventManager;
    this.eventManager.on("player:move", this.move.bind(this));
  }

  hittingStuff(direction, blocks) {
    const [dx, dy] = direction;
    let block = null;
    for (let i = 0; i < blocks.length; i++) {
      block = blocks[i];
      if (block.props.type === "player") {
        continue;
      }

      const isHittingHorizontally =
        (dx > 0 && block.x === this.x + this.width) ||
        (dx < 0 && block.x + block.width === this.x);

      const isHittingVertically =
        (dy > 0 && block.y === this.y + this.height) ||
        (dy < 0 && block.y + block.height === this.y);

      if (
        (dx !== 0 && isHittingHorizontally && block.y === this.y) ||
        (dy !== 0 && isHittingVertically && block.x === this.x)
      ) {
        return i;
      }
    }
    return -1;
  }

  pushCrateIfPossible(block, data) {
    const [dx, dy] = data.direction;
    const newCrateX = block.x + dx * block.width;
    const newCrateY = block.y + dy * block.height;

    if (!this.wouldHit(block, data.blocks, newCrateX, newCrateY)) {
      block.x = newCrateX;
      block.y = newCrateY;

      this.eventManager.emit("block:move", { block });

      return true;
    }

    return false;
  }

  isOnTarget(block, blocks) {
    for (let i = 0; i < blocks.length; i++) {
      const otherBlock = blocks[i];
      if (
        otherBlock.props.type === "target" &&
        otherBlock.x === block.x &&
        otherBlock.y === block.y
      ) {
        return true;
      }
    }
    return false;
  }

  wouldHit(block, blocks, newX, newY) {
    for (let i = 0; i < blocks.length; i++) {
      const otherBlock = blocks[i];
      if (otherBlock === block || otherBlock.props.type === "player") {
        continue;
      }

      if (
        otherBlock.x === newX &&
        otherBlock.y === newY &&
        otherBlock.props.type !== "target"
      ) {
        return true;
      }
    }

    return false;
  }

  move(data) {
    const hit = this.hittingStuff(data.direction, data.blocks);
    if (this.props.type === "player") {
      const [x, y] = data.direction;
      let canMove = true;

      if (hit > -1) {
        const block = data.blocks[hit];
        if (block.props.type === "crate") {
          canMove = this.pushCrateIfPossible(block, data);
        }
        if (block.props.type === "obstacle") {
          canMove = false;
        }
      }

      if (canMove) {
        this.x += x * this.width;
        this.y += y * this.height;
        this.eventManager.emit("player:moved", { block: this });
      }
    }
  }
}

class Board {
  constructor(game, canvasWidth, canvasHeight) {
    this.game = game;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }
  grid(context) {
    context.lineWidth = 1;
    for (let x = 0; x < this.canvasWidth; x += this.game.blockSize) {
      context.beginPath();
      context.strokeStyle = "#d3d3d3";
      context.moveTo(x, 0);
      context.lineTo(x, this.canvasHeight);
      context.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += this.game.blockSize) {
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

const loadGame = async () => {
  const req = await fetch("./map1.json");
  const level = await req.json();

  const blockSize = 40;
  const rows = 16;
  const columns = 16;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const scale = window.devicePixelRatio;

  canvas.width = Math.floor((columns * blockSize * scale) / 2);
  canvas.height = Math.floor((rows * blockSize * scale) / 2);
  const eventManager = new EventManager();
  eventManager.on(
    "targets",
    (t) => (document.getElementById("targets").innerHTML = t),
  );
  new InputHandler(eventManager);
  const game = new Game(
    level,
    rows,
    columns,
    blockSize,
    canvas,
    ctx,
    eventManager,
  );

  game.draw(ctx);
};

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

window.addEventListener("load", loadGame);
