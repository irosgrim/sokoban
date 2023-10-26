const sprite = new Image();
sprite.src = "./assets/sprite.png";

const menuSprite = new Image();
menuSprite.src = "./assets/menu.png";

const eventManager = new EventManager();

const setupCanvas = (canvasId, rows, columns, blockSize, scale) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.width = Math.floor((columns * blockSize * scale) / 2);
  canvas.height = Math.floor((rows * blockSize * scale) / 2);
  return { canvas, ctx };
};

const runEditor = (customLevel, gameCanvas, gameCanvasCtx, sprite) => {
  const { blockSize, rows, columns, scale } = CONFIG;
  const { canvas: spriteCanvas, ctx: spriteCanvasCtx } = setupCanvas(
    "sprite",
    rows,
    columns,
    blockSize,
    scale,
  );
  spriteCanvas.width = Math.floor((columns * blockSize * scale) / 2);
  spriteCanvas.height = Math.floor((blockSize * scale) / 2);

  const menu = new EditorMenu(sprite, spriteCanvas, spriteCanvasCtx, CONFIG);
  menu.draw();
  const editor = new EditorEvents(
    eventManager,
    gameCanvas,
    gameCanvasCtx,
    menu,
    sprite,
    customLevel,
  );

  gameCanvasCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  editor.draw();
  const board = new Board(16 * blockSize, 16 * blockSize, blockSize);
  eventManager.listen("grid:repaint", (d) => board.draw(gameCanvasCtx));
};

const runGame = async (customLevel, canvas, ctx, eventManager, sprite) => {
  const { rows, columns, blockSize } = CONFIG;
  let level = null;
  if (customLevel) {
    level = JSON.parse(atob(customLevel));
    console.log(JSON.stringify(level));
  } else {
    const req = await fetch("./map1.json");
    level = await req.json();
  }

  const setScore = (t) => {
    document.getElementById("targets").innerHTML = t;
  };

  eventManager.listen("targets", setScore);
  new InputHandler(eventManager);
  const game = new Game(
    level,
    rows,
    columns,
    blockSize,
    canvas,
    ctx,
    eventManager,
    sprite,
  );
  game.draw(ctx);
};

const saveLevel = (levelData) => {
  const { level } = levelData;
  const j = JSON.stringify(level);
  const b = btoa(j);
  const params = new URLSearchParams(window.location.search);
  params.delete("editor");
  params.set("level", b);
  const newUrl = `${window.location.protocol}//${window.location.host}${
    window.location.pathname
  }?${params.toString()}`;
  window.location.href = newUrl;
};

const loadGame = async () => {
  const { blockSize, rows, columns, scale } = CONFIG;
  const params = new URLSearchParams(window.location.search);
  const editor = params.get("editor");
  const customLevel = params.get("level");

  const { canvas, ctx } = setupCanvas(
    "canvas",
    rows,
    columns,
    blockSize,
    scale,
  );

  if (!editor) {
    const editorMenuCanvas = document.getElementById("sprite");
    editorMenuCanvas.style.display = "none";
    runGame(customLevel, canvas, ctx, eventManager, sprite);
  } else {
    const status = document.getElementById("status");
    status.style.display = "none";
    runEditor(customLevel, canvas, ctx, sprite);
    eventManager.listen("editor:save", saveLevel);
  }
};

window.addEventListener("load", loadGame);
