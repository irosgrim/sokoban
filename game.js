const b = [
    [0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,1,0,2,0,0,1,1],
    [1,0,2,0,2,0,0,1,0,1,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1,0,1,0,0,0,0,1,1],
    [1,0,0,4,0,0,0,1,0,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,2,1,0,1,0,0,0,2,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
    [0,1,0,0,1,0,1,0,0,1,1,1,0,0,0,1],
    [0,1,0,0,2,0,1,0,0,1,0,2,0,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1,0,1,0,0,0,0,3,1],
    [1,0,0,0,0,0,2,1,0,1,0,0,0,2,0,1],
    [1,0,0,0,0,0,0,1,0,1,0,0,0,0,1,1],
    [1,1,1,1,1,0,0,3,0,1,1,1,0,0,0,1],
    [0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
];

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

}

const blox = [];

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
    constructor(blocks, rows, columns, blockSize, canvasElement, ctx) {
        this.blockSize = blockSize
        this.rows = rows;
        this.columns = columns;
        this.blocks = [];
        this.playerBlock = null;
        this.direction = [0, 0];
        this.input = new InputHandler(this, ctx);
        this.canvas = canvasElement;
        this.board = new Board(this, columns * blockSize, rows * blockSize);
        this.events = new EventManager();
        this.makeBlocks(blocks);
    }
    update() {
        for (const block of this.blocks) {
            block.update();
        }
        this.playerBlock.update(); 
    }
    draw(context) {
        for (const block of this.blocks) {
            block.draw(context)
        }
        this.playerBlock.draw(context);
        this.board.draw(context);
    }
    makeBlocks(blocks) {
        for (let y = 0; y < blocks.length; y++) {
            for (let x = 0; x < blocks[y].length; x++) {
                if (blockType[blocks[y][x]]) {
                    let blockConfig = {
                        x: x * this.blockSize,
                        y: y * this.blockSize,
                        width: this.blockSize,
                        height: this.blockSize,
                        props: blockType[blocks[y][x]],
                    };
                    
                    if (blockConfig.props.type === "player") {
                        this.playerBlock = new MovableBlock(this, this.events, blockConfig);
                    } else if (blockConfig.props.type === "crate") {
                        this.blocks.push(new MovableBlock(this, this.events, blockConfig));
                    } else {
                        this.blocks.push(new Block(this, this.events, blockConfig));
                    }
                }
            }
        }
    }
    reset() {}
};

class Block {
    constructor(game, events, block) {
        this.game = game;
        this.events = events;
        this.x = block.x;
        this.y = block.y;
        this.height = block.height;
        this.width = block.width;
        this.props = block.props;
        this.events.on("playerMoved", this.move);
    }
    move (data) {
        console.log("event of movement", data)
    }
    update() {
        const hit = this.hittingStuff();
        if (this.props.type === "player") {
            const [x, y] = this.game.direction;
            let canMove = true; 

            if (hit > 0) {
                const block = this.game.blocks[hit];
                if (block.props.type === "crate") {
                    canMove = this.pushCrateIfPossible(block);
                }
                if (block.props.type === "obstacle") {
                    canMove = false;
                }
            }

            if (canMove) {
                this.x += (x * this.width);
                this.y += (y * this.height);
            }
        }
    }

    draw(context) {
        context.fillStyle = this.props.fillStyle;
        context.strokeStyle = this.props.strokeStyle;
        context.lineWidth = 6;
        context.fillRect(this.x+6, this.y+6, this.height-12, this.width-12);
        context.strokeRect(this.x+3, this.y+3, this.height - 6, this.width - 6);
    }
    hittingStuff() {
        const [dx, dy] = this.game.direction;
        this.game.events.emit('block:checkCollision', { block: this });
        let block = null;
        for (let i = 0; i < this.game.blocks.length; i++) {
            block = this.game.blocks[i];
            if (block.props.type === "player") {
                continue;
            }

            const isHittingHorizontally = (dx > 0 && block.x === this.x + this.width) || 
                                        (dx < 0 && block.x + block.width === this.x);
            
            const isHittingVertically = (dy > 0 && block.y === this.y + this.height) ||
                                        (dy < 0 && block.y + block.height === this.y);
            
            if ((dx !== 0 && isHittingHorizontally && block.y === this.y) || 
                (dy !== 0 && isHittingVertically && block.x === this.x)) {
                return i;
            }
        }
        return -1;
    }

    pushCrateIfPossible(block) {
        const [dx, dy] = this.game.direction;
        const newCrateX = block.x + dx * block.width;
        const newCrateY = block.y + dy * block.height;

        if (!this.wouldHit(block, newCrateX, newCrateY)) {
            block.x = newCrateX;
            block.y = newCrateY;
            return true;
        }

        return false;
    }

    wouldHit(block, newX, newY) {
        for (let i = 0; i < this.game.blocks.length; i++) {
            const otherBlock = this.game.blocks[i];
            if (otherBlock === block || otherBlock.props.type === "player") {
                continue;
            }

            if (otherBlock.x === newX && otherBlock.y === newY) {
                return true;
            }
        }
        return false;
    }
}

class MovableBlock extends Block {
    constructor (game, events, block) {
        super (game, events, block)
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
            context.strokeStyle = "#d3d3d3"
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
    update(){}
    draw(context){
        this.grid(context);
    }
}


const loadGame = () => {
    const blockSize = 40;
    const rows = 16;
    const columns = 16;
    
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const scale = window.devicePixelRatio;

    canvas.width = Math.floor((columns * blockSize) * scale /2);
    canvas.height = Math.floor((rows * blockSize) * scale /2);
    const game = new Game(b, rows, columns, blockSize, canvas, ctx);
    
    game.draw(ctx);
}

class InputHandler {
    constructor(game, ctx) {
        this.game = game;
        this.ctx = ctx;
        window.addEventListener("keydown", e => {
            e.preventDefault();
            this.changeDirection(e.key);
        });
    }
    
    changeDirection(key) {
        const directions = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
        }
        if (directions[key]) {
            const [x, y] = this.game.direction;
            let allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            if (allowedKeys.includes(key)) {
                this.game.direction = directions[key];
                this.ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.game.update();
                this.game.events.emit("playerMoved", this.game.player);
                this.game.draw(this.ctx);
            }
        }
    }
}

window.addEventListener("load", loadGame);