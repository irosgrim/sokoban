const sprite = new Image();
sprite.src = "./assets/sprite.png";

const menuSprite = new Image();
menuSprite.src = "./assets/menu.png";

const loadFonts = async () => {
  const font = new FontFace(
    "PressStart2P-Regular",
    "url(./assets/PressStart2P-Regular.ttf)",
    {
      style: "normal",
    },
  );
  await font.load();
  document.fonts.add(font);
  // enable font with CSS class
  document.body.classList.add("pixel-font");
};

let eventManager = new EventManager();

const setupCanvas = (
  canvasId,
  rows,
  columns,
  blockSize,
  scale,
  isMenu = false,
) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.width = Math.floor((columns * blockSize * scale) / 2);
  canvas.height = Math.floor((rows * blockSize * scale) / 2);
  if (isMenu) {
    canvas.width = Math.floor((columns * blockSize * scale) / 2);
    canvas.height = Math.floor((blockSize * scale) / 2);
  }
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
    true,
  );

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
  const { rows, columns, blockSize, scale } = CONFIG;
  let level = null;

  if (customLevel) {
    level = JSON.parse(atob(customLevel));
  } else {
    const req = await fetch("./map1.json");

    if (req.ok) {
      level = await req.json();
    } else {
      console.log("Failed to load level", req.status, req.statusText);
      return;
    }
  }

  if (level === null) {
    console.log("Level is null");
    return;
  }

  new InputHandler(eventManager);

  const { canvas: gameMenuCanvas, ctx: gameMenuCanvasCtx } = setupCanvas(
    "sprite",
    rows,
    columns,
    blockSize,
    scale,
    true,
  );
  new GameMenu(
    rows,
    columns,
    blockSize,
    gameMenuCanvas,
    gameMenuCanvasCtx,
    eventManager,
    menuSprite,
  );
  new Game(level, rows, columns, blockSize, canvas, ctx, eventManager, sprite);
};
const downloadLevel = (levelData) => {
  const blob = new Blob([JSON.stringify(levelData.level)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "custom-level.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
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

const { blockSize, rows, columns, scale } = CONFIG;
const { canvas, ctx } = setupCanvas("canvas", rows, columns, blockSize, scale);

const loadGame = async () => {
  await loadFonts();
  const params = new URLSearchParams(window.location.search);
  const editor = params.get("editor");
  const customLevel = params.get("level");

  if (!editor) {
    runGame(customLevel, canvas, ctx, eventManager, sprite);
  } else {
    runEditor(customLevel, canvas, ctx, sprite);
    eventManager.listen("editor:save", saveLevel);
    eventManager.listen("editor:download", downloadLevel);
  }
};

window.addEventListener("load", loadGame);
