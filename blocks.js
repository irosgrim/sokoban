
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
