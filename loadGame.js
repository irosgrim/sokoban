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

window.addEventListener("load", loadGame);