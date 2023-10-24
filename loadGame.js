
const sprite = new Image();
sprite.src = "./assets/sprite.png";
const eventManager = new EventManager();

const runEditor = (customLevel, canvas, ctx, sprite) => {
  const {blockSize, rows, columns, scale} = CONFIG;

  const spriteMenuCanvas = document.getElementById("sprite");
  const spriteCtx = spriteMenuCanvas.getContext("2d");
  spriteMenuCanvas.width = Math.floor((columns * blockSize * scale) / 2);
  spriteMenuCanvas.height = Math.floor((blockSize * scale) / 2);
  const menu = new EditorMenu(sprite, spriteMenuCanvas, spriteCtx, CONFIG);
  menu.draw();
  const editor = new EditorEvents(eventManager, canvas, ctx, menu, sprite, customLevel);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  editor.draw();
  const board = new Board(16 * blockSize, 16 * blockSize, blockSize);
  
  eventManager.listen("grid:repaint", (d) => board.draw(ctx));

}

const runGame = async (customLevel, canvas, ctx, eventManager, sprite) => {
  const {rows, columns, blockSize} = CONFIG;
  let level = null;
  if (customLevel) {
    level = JSON.parse(atob(customLevel));
  } else {
    const req = await fetch("./map1.json");
    level = await req.json();
  }

  const setScore = (t) => {
    document.getElementById("targets").innerHTML = t
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
}

const saveLevel = (levelData) => {
  const { level } = levelData;
  const j = JSON.stringify(level);
  const b = btoa(j);
  const params = new URLSearchParams(window.location.search);
  params.delete("editor");
  params.set("level", b);
  const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${params.toString()}`;

  window.location.href = newUrl; 
}

const loadGame = async () => {
  const buttons = document.querySelectorAll("button");

  for(const button of buttons) {
    if (button.id.includes("Arrow")) {
      button.addEventListener("click", (e) =>{
        const keydownEvent = new KeyboardEvent("keydown", {
          key: button.id,
          code: button.id
        });
        window.dispatchEvent(keydownEvent);
      });
    }
  }
  const {blockSize, rows, columns, scale} = CONFIG;
  const status = document.getElementById("status");
  const editorMenuCanvas = document.getElementById("sprite");


  const params = new URLSearchParams(window.location.search);
  const editor = params.get("editor");
  const customLevel = params.get("level");

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = Math.floor((columns * blockSize * scale) / 2);
  canvas.height = Math.floor((rows * blockSize * scale) / 2);

  if (!editor) {
    editorMenuCanvas.style.display = "none";
    runGame(customLevel, canvas, ctx, eventManager, sprite);
  } else {
    status.style.display = "none";
    runEditor(customLevel, canvas, ctx, sprite);
    eventManager.listen("editor:save", saveLevel);
  }
};

window.addEventListener("load", loadGame);
