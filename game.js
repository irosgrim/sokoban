const b = [
    ["_","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x"],
    ["x","o","_","_","o","_","_","x","o","_","_","o","_","_","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","p","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","_","_","_","o","x","_","_","_","_","_","o","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","x","x","x","x","_","_","_","x","x","x","x","_","_","_","x"],
    ["x","o","_","_","o","_","_","x","o","_","_","o","_","_","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","_","_","_","_","_","o","x","_","_","_","_","_","o","x","x"],
    ["x","_","_","_","_","_","_","x","_","_","_","_","_","_","x","x"],
    ["x","x","x","x","x","_","_","_","x","x","x","x","_","_","_","x"],
    ["_","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x"],
];

const blockType = {
    x: {
        fillStyle: "blue",
        strokeStyle: "gray",
        lineWidth: 6,
        type: "obstacle",
    },
    _: null,
    o: {
        fillStyle: "yellow",
        strokeStyle: "brown",
        lineWidth: 6,
        type: "box",
    },
    p: {
        fillStyle: "white",
        strokeStyle: "black",
        lineWidth: 6,
        type: "player",
    },
    t: {
        fillStyle: "green",
        strokeStyle: "green",
        lineWidth: 6,
        type: "target",
    },

}

const blox = [];


class Game {
    constructor(blocks, rows, columns, blockSize, canvasElement, ctx) {
        this.blockSize = blockSize
        this.rows = rows;
        this.columns = columns;
        this.blocks = [];
        this.makeBlocks(blocks);
        this.direction = [0, 0];
        this.input = new InputHandler(this, ctx);
        this.canvas = canvasElement;
        this.board = new Board(this, columns * blockSize, rows * blockSize);
        // this.timeToNextStep = 0;
        // this.stepInterval = 150;
        // this.lastTime = 0;
    }
    update() {
        // this.player.update();
        for (const block of this.blocks) {
            block.update();
        }
    }
    draw(context) {
        for (const block of this.blocks) {
            block.draw(context)
        }
        this.board.draw(context);
    }
    makeBlocks(blocks) {
        for (let y = 0; y < blocks.length; y++) {
            for (let x = 0; x < blocks[y].length; x++) {
                if (blockType[blocks[y][x]]) {
                    this.blocks.push(new Block(this, {
                        x: x * this.blockSize,
                        y: y * this.blockSize,
                        width: this.blockSize,
                        height: this.blockSize,
                        props: blockType[blocks[y][x]],
                    }))
                }
            }
        }

    }
    reset() {}
};

class Block {
    constructor(game, block) {
        this.game = game;
        this.x = block.x;
        this.y = block.y;
        this.height = block.height;
        this.width = block.width;
        this.props = block.props;
    }
    update() {
        if (this.props.type === "player") {
            const [x, y] = this.game.direction;
            this.x += (x * this.width);
            this.y += (y * this.height);
        }
    }
    draw(context) {
        context.fillStyle = this.props.fillStyle;
        context.strokeStyle = this.props.strokeStyle;
        context.lineWidth = 6;
        context.fillRect(this.x+6, this.y+6, this.height-12, this.width-12);
        context.strokeRect(this.x+3, this.y+3, this.height - 6, this.width - 6);
    }
    move() {}
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
    // canvas.style.width = `${blockSize*columns}px`;
    // canvas.style.height = `${blockSize*rows}px`;
    
    const ctx = canvas.getContext("2d");
    const scale = window.devicePixelRatio;

    canvas.width = Math.floor((columns * blockSize) * scale /2);
    canvas.height = Math.floor((rows * blockSize) * scale /2);
    const game = new Game(b, rows, columns, blockSize, canvas, ctx);
    
    game.draw(ctx);

    // const gameLoop = (timestamp = 0) => {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     let deltaTime = timestamp - game.lastTime;
    //     game.lastTime = timestamp;
    //     game.timeToNextStep += deltaTime;
    //     game.draw(ctx);
       
    //     // if(game.timeToNextStep > game.stepInterval) {
    //     //     game.timeToNextStep = 0;
    //     // }
    //     game.update();
    //     window.requestAnimationFrame(gameLoop);
    // }

    // gameLoop();
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
            // if (x) {
            //     allowedKeys = allowedKeys.filter(x => !["ArrowLeft", "ArrowRight"].includes(x))
            // }
            // if (y) {
            //     allowedKeys = allowedKeys.filter(x => !["ArrowUp", "ArrowDown"].includes(x))
            // }
            if (allowedKeys.includes(key)) {
                this.game.direction = directions[key];
                this.ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.game.update();
                this.game.draw(this.ctx);
            }
        }
    }
}

window.addEventListener("load", loadGame);