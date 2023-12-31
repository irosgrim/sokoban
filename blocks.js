const PLAYER_SPRITE = new Map([
  ["DOWN", 4],
  ["UP", 6],
  ["RIGHT", 7],
  ["LEFT", 5],
]);
class Block {
  constructor(eventManager, block, sprite) {
    this.eventManager = eventManager;
    this.x = block.x;
    this.y = block.y;
    this.height = block.height;
    this.width = block.width;
    this.props = block.props;
    this.zIndex = block.zIndex;
    this.isOnTarget = false;
    this.sprite = sprite;
    this.direction = null;
    if (this.props.type === "player") {
      this.direction = "DOWN";
    }
  }

  spriteToBlock(context) {
    let sx = CONFIG.spriteSize * this.props.bg;
    let sy = 0;
    if (this.props.type === "player") {
      sx = CONFIG.spriteSize * PLAYER_SPRITE.get(this.direction);
    }
    if (this.props.type === "crate" && this.isOnTarget) {
      sy = CONFIG.spriteSize;
    }
    context.drawImage(
      this.sprite,
      sx,
      sy,
      CONFIG.spriteSize,
      CONFIG.spriteSize,
      this.x,
      this.y,
      CONFIG.blockSize,
      CONFIG.blockSize,
    );
  }

  drawObstacle(context) {
    context.strokeStyle = "rgba(255, 255, 255, 0)";
    context.lineWidth = 1;
    context.strokeRect(this.x + 1, this.y + 1, this.height - 1, this.width - 1);
    context.fillStyle = this.props.fillStyle;
    context.strokeStyle = this.props.strokeStyle;
    context.lineWidth = 4;
    context.strokeRect(this.x + 2, this.y + 2, this.height - 5, this.width - 5);
    context.fillRect(this.x + 4, this.y + 4, this.height - 9, this.width - 9);
  }

  drawTarget(context) {
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
    context.lineWidth = 4;
    context.strokeStyle = "#003300";
    context.stroke();
  }

  drawOtherBlocks(context) {
    context.fillRect(this.x + 6, this.y + 6, this.height - 12, this.width - 12);
    context.strokeRect(this.x + 3, this.y + 3, this.height - 6, this.width - 6);
  }

  draw(context) {
    if (this.sprite && this.props.bg !== null) {
      this.spriteToBlock(context);
    } else {
      context.fillStyle = this.props.fillStyle;
      context.strokeStyle = this.props.strokeStyle;
      context.lineWidth = 6;
      if (this.props.type === "target") {
        this.drawTarget(context);
      } else if (this.props.type === "obstacle") {
        this.drawObstacle(context);
      } else {
        this.drawOtherBlocks(context);
      }
    }
  }
}

class MovableBlock extends Block {
  constructor(eventManager, block, sprite) {
    super(eventManager, block, sprite);
    this.eventManager = eventManager;
    this.listenerAdded = false;
    if (!this.listenerAdded && this.props.type === "player") {
      this.eventManager.listen("player:move", this.move.bind(this));
      this.listenerAdded = true;
    }
  }

  hittingBlocksAtIndex(direction, blocks) {
    const [dx, dy] = direction;
    let block = null;
    const hitting = [];
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
        hitting.push(i);
        if (hitting.length > 1) {
          return hitting;
        }
      }
    }
    return hitting;
  }

  pushCrateIfPossible(block, data) {
    const [dx, dy] = data.direction;
    const newCrateX = block.x + dx * block.width;
    const newCrateY = block.y + dy * block.height;

    if (!this.wouldHit(block, data.blocks, newCrateX, newCrateY)) {
      block.x = newCrateX;
      block.y = newCrateY;

      this.eventManager.broadcast("block:move", { block });
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
    const [x, y] = data.direction;
    if (x > 0) this.direction = "RIGHT";
    if (x < 0) this.direction = "LEFT";

    if (y > 0) this.direction = "DOWN";
    if (y < 0) this.direction = "UP";
    if (x === 0 && y === 0) this.direction = "DOWN";

    const hit = this.hittingBlocksAtIndex(data.direction, data.blocks);
    if (this.props.type === "player") {
      let canMove = true;

      if (hit.length > 0) {
        for (const h of hit) {
          const block = data.blocks[h];
          if (block.props.type === "crate") {
            canMove = this.pushCrateIfPossible(block, data);
          }
          if (block.props.type === "obstacle") {
            canMove = false;
          }
        }
      }

      if (canMove) {
        const canvasWidth = data.canvasWidth;
        const canvasHeight = data.canvasHeight;

        let newX = this.x + x * this.width;
        let newY = this.y + y * this.height;

        if ((this.x > 0 || x > 0) && newX < canvasWidth && newX >= 0) {
          this.x = newX;
        }
        if ((this.y > 0 || y > 0) && newY < canvasHeight && newY >= 0) {
          this.y = newY;
        }

        this.eventManager.broadcast("player:step", 1);
      }
    }
  }
}
