import * as THREE from 'three';

function createThatchCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f5ba4c';
  ctx.fillRect(0, 0, size, size);

  const rowCount = 14;
  const rowHeight = size / rowCount;

  for (let r = 0; r < rowCount; r++) {
    const y = r * rowHeight;
    const grad = ctx.createLinearGradient(0, y, 0, y + rowHeight);
    grad.addColorStop(0, '#bd7d24');
    grad.addColorStop(0.15, '#f7c85e');
    grad.addColorStop(0.55, '#ffea94');
    grad.addColorStop(0.85, '#f0b843');
    grad.addColorStop(1, '#9e6215');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, rowHeight);

    ctx.fillStyle = '#7a450b';
    ctx.fillRect(0, y + rowHeight - 3, size, 3);
    ctx.fillStyle = '#fff9d4';
    ctx.fillRect(0, y, size, 2);

    for (let s = 0; s < 120; s++) {
      const sx = (s * 4.3 + (r % 3) * 3.7) % size;
      const length = rowHeight * (0.85 + ((s * 17) % 30) / 100);
      const angle = (((s * 31) % 20) - 10) * 0.02;
      const shade = (s * 13) % 5;
      ctx.strokeStyle =
        shade === 0
          ? '#fffde8'
          : shade === 1
          ? '#ffdf7a'
          : shade === 2
          ? '#f3b438'
          : shade === 3
          ? '#cb8722'
          : '#8f520f';
      ctx.lineWidth = 1.4 + ((s * 7) % 2);
      ctx.beginPath();
      ctx.moveTo(sx, y + 2);
      ctx.lineTo(sx + Math.sin(angle) * length, y + 2 + length);
      ctx.stroke();
    }
  }

  return canvas;
}

function createTimberPlanksCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#deb37f';
  ctx.fillRect(0, 0, size, size);

  const plankCount = 8;
  const plankH = size / plankCount;
  const baseTones = ['#e6be8d', '#dcaf7a', '#edd2a6', '#d6a36c', '#e3b886', '#dfb17e', '#f2d8b1', '#d9a671'];

  for (let p = 0; p < plankCount; p++) {
    const y = p * plankH;
    ctx.fillStyle = baseTones[p % baseTones.length];
    ctx.fillRect(0, y, size, plankH);

    for (let g = 0; g < 45; g++) {
      const gy = y + ((g * 1.5) % plankH);
      const wave = Math.sin(g * 0.55) * 2.5;
      ctx.strokeStyle = g % 2 === 0 ? '#fbe6cb' : '#b88046';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.33, gy + wave, size * 0.66, gy - wave, size, gy);
      ctx.stroke();
    }

    if (p % 2 === 0) {
      const kx = 80 + ((p * 127) % 340);
      const ky = y + plankH * 0.5;
      ctx.fillStyle = '#875122';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 9, 5.5, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8deb8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = '#6b3f17';
    ctx.fillRect(0, y + plankH - 3, size, 3);
    ctx.fillStyle = '#fffaea';
    ctx.fillRect(0, y, size, 1.8);

    for (const nx of [25, size - 25, 160, 335]) {
      ctx.fillStyle = '#4d3929';
      ctx.beginPath();
      ctx.arc(nx, y + plankH * 0.3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(nx, y + plankH * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

function createTimberLogsCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#d6a269';
  ctx.fillRect(0, 0, size, size);

  const logCount = 6;
  const logH = size / logCount;

  for (let l = 0; l < logCount; l++) {
    const y = l * logH;
    const grad = ctx.createLinearGradient(0, y, 0, y + logH);
    grad.addColorStop(0, '#75471d');
    grad.addColorStop(0.15, '#c99153');
    grad.addColorStop(0.5, '#f5ce99');
    grad.addColorStop(0.85, '#c99153');
    grad.addColorStop(1, '#663c16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, logH);

    for (let b = 0; b < 50; b++) {
      const by = y + ((b * 1.8) % logH);
      ctx.strokeStyle = b % 2 === 0 ? '#ffebd2' : '#9c642e';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(size, by + Math.sin(b * 0.9) * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#4a290d';
    ctx.fillRect(0, y + logH - 4, size, 4);
    ctx.fillStyle = '#fff4e5';
    ctx.fillRect(0, y + 1, size, 2);
  }

  return canvas;
}

function createWattleDaubCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f6edd9';
  ctx.fillRect(0, 0, size, size);

  const gridStep = 64;
  for (let gx = 0; gx < size; gx += gridStep) {
    ctx.fillStyle = 'rgba(195, 155, 105, 0.15)';
    ctx.fillRect(gx, 0, 4, size);
  }
  for (let gy = 0; gy < size; gy += gridStep) {
    ctx.fillStyle = 'rgba(195, 155, 105, 0.15)';
    ctx.fillRect(0, gy, size, 4);
  }

  for (let i = 0; i < 3500; i++) {
    const x = (i * 97) % size;
    const y = (i * 139) % size;
    const rad = 1.5 + (i % 5);
    const alpha = 0.12 + ((i % 10) * 0.025);
    ctx.fillStyle = i % 3 === 0 ? `rgba(205, 175, 135, ${alpha})` : i % 3 === 1 ? `rgba(165, 130, 95, ${alpha * 0.9})` : `rgba(255, 255, 255, ${alpha * 1.6})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let s = 0; s < 300; s++) {
    const sx = (s * 47) % size;
    const sy = (s * 83) % size;
    const len = 6 + (s % 12);
    const ang = (s * 23) * 0.1;
    ctx.strokeStyle = s % 2 === 0 ? '#c79854' : '#dfb574';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    ctx.stroke();
  }

  return canvas;
}

function createStoneMasonryCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#dbe4ee';
  ctx.fillRect(0, 0, size, size);

  const rowCount = 10;
  const rowH = size / rowCount;
  const stoneTones = ['#eaf0f8', '#e2e9f3', '#f4f7fb', '#d9e3ee', '#edf2f7', '#dfe7f1'];

  for (let r = 0; r < rowCount; r++) {
    const y = r * rowH;
    const offset = (r % 2) * 38;
    let x = -offset;

    while (x < size) {
      const stoneW = 55 + ((r * 31 + Math.abs(x) * 17) % 45);
      const toneIdx = Math.abs(Math.floor(x * 7 + r * 13)) % stoneTones.length;
      ctx.fillStyle = stoneTones[toneIdx];
      ctx.fillRect(x + 2, y + 2, stoneW - 4, rowH - 4);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, stoneW - 4, 1.8);
      ctx.fillRect(x + 2, y + 2, 1.8, rowH - 4);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.fillRect(x + 2, y + rowH - 4, stoneW - 4, 2);
      ctx.fillRect(x + stoneW - 4, y + 2, 2, rowH - 4);

      for (let dot = 0; dot < 14; dot++) {
        const dx = x + 6 + ((dot * 19) % (stoneW - 12));
        const dy = y + 5 + ((dot * 23) % (rowH - 10));
        ctx.fillStyle = dot % 2 === 0 ? 'rgba(100, 116, 139, 0.22)' : 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(dx, dy, 1.5, 1.5);
      }

      x += stoneW;
    }
  }

  return canvas;
}

function createTentFabricCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f0d9b8';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size; i += 4) {
    ctx.strokeStyle = i % 8 === 0 ? '#d9b687' : '#fcedd7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  for (let f = 0; f < 3; f++) {
    const fx = 80 + f * 170;
    ctx.strokeStyle = 'rgba(115, 80, 45, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, 0);
    ctx.lineTo(fx + 20, size);
    ctx.stroke();
  }

  return canvas;
}

function createSoilCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#5c4330';
  ctx.fillRect(0, 0, size, size);

  for (let r = 0; r < 8; r++) {
    const y = r * 64;
    const grad = ctx.createLinearGradient(0, y, 0, y + 64);
    grad.addColorStop(0, '#3a2718');
    grad.addColorStop(0.5, '#73553e');
    grad.addColorStop(1, '#301e12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, 64);
  }

  for (let p = 0; p < 1800; p++) {
    const px = (p * 79) % size;
    const py = (p * 113) % size;
    const pr = 1 + (p % 3);
    ctx.fillStyle = p % 3 === 0 ? '#826247' : p % 3 === 1 ? '#4a3120' : '#332011';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function createRugCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#992d29';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#e2ab4b';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, size - 32, size - 32);

  ctx.fillStyle = '#22476b';
  ctx.fillRect(32, 32, size - 64, size - 64);

  const step = 48;
  for (let x = 48; x < size - 48; x += step) {
    for (let y = 48; y < size - 48; y += step) {
      ctx.fillStyle = (x + y) % (step * 2) === 0 ? '#d1433c' : '#f0b854';
      ctx.beginPath();
      ctx.moveTo(x + step / 2, y);
      ctx.lineTo(x + step, y + step / 2);
      ctx.lineTo(x + step / 2, y + step);
      ctx.lineTo(x, y + step / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas;
}

function makeTexture(canvas: HTMLCanvasElement, repX = 1, repY = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export const BUILDING_TEXTURES = {
  thatch: makeTexture(createThatchCanvas(), 2, 2),
  thatchSteep: makeTexture(createThatchCanvas(), 2, 1),
  timberPlanks: makeTexture(createTimberPlanksCanvas(), 2, 2),
  timberPlanksFine: makeTexture(createTimberPlanksCanvas(), 4, 1),
  timberLogs: makeTexture(createTimberLogsCanvas(), 2, 2),
  wattleDaub: makeTexture(createWattleDaubCanvas(), 2, 2),
  stoneMasonry: makeTexture(createStoneMasonryCanvas(), 2, 2),
  stoneFoundation: makeTexture(createStoneMasonryCanvas(), 4, 1),
  tentFabric: makeTexture(createTentFabricCanvas(), 2, 2),
  soil: makeTexture(createSoilCanvas(), 2, 2),
  rug: makeTexture(createRugCanvas(), 1, 1),
};
