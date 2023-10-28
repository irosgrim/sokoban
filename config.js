const cfg = () => {
  const rows = 16;
  const columns = 16;
  const scale = window.devicePixelRatio;
  const blockSize = 40 * scale;
  const spriteSize = 120;

  return {
    blockSize,
    rows,
    columns,
    scale,
    spriteSize,
  };
};

const CONFIG = cfg();
