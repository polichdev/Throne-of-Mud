import * as THREE from 'three';

export function createTunicCanvas(
  baseColor: string,
  pattern: 'plain' | 'weave' | 'stripes' | 'check' | 'embroidery' = 'weave',
  trimColor = '#f59e0b'
): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size; i += 4) {
    ctx.strokeStyle = i % 8 === 0 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
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

  if (pattern === 'stripes') {
    for (let x = 16; x < size; x += 32) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(x, 0, 8, size);
    }
  } else if (pattern === 'check') {
    const step = 24;
    for (let x = 0; x < size; x += step) {
      for (let y = 0; y < size; y += step) {
        if ((x / step + y / step) % 2 === 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.fillRect(x, y, step, step);
        }
      }
    }
  } else if (pattern === 'embroidery') {
    ctx.fillStyle = trimColor;
    ctx.fillRect(0, 0, size, 12);
    ctx.fillRect(0, size - 16, size, 16);
    ctx.fillRect(size / 2 - 8, 0, 16, size);

    for (let x = 8; x < size; x += 16) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, 6, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, size - 4, size, 4);

  return canvas;
}

export function createTrousersCanvas(baseColor: string): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    ctx.strokeStyle = y % 6 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let p = 0; p < 800; p++) {
    const px = (p * 47) % size;
    const py = (p * 97) % size;
    ctx.fillStyle = p % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(px, py, 2, 2);
  }

  return canvas;
}

export function createFaceCanvas(
  skinTone: string,
  eyeColor: string,
  hairColor: string,
  beardType: 'none' | 'stubble' | 'mustache' | 'full_beard' | 'braid_beard' = 'none',
  expression: 'calm' | 'smile' | 'determined' = 'smile'
): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = skinTone;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(235, 100, 85, 0.22)';
  ctx.beginPath();
  ctx.ellipse(60, 148, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(196, 148, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeY = 110;
  const leftEyeX = 74;
  const rightEyeX = 182;

  ctx.fillStyle = hairColor;
  ctx.fillRect(leftEyeX - 26, eyeY - 32, 52, 12);
  ctx.fillRect(rightEyeX - 26, eyeY - 32, 52, 12);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(leftEyeX - 26, eyeY - 32, 52, 12);
  ctx.strokeRect(rightEyeX - 26, eyeY - 32, 52, 12);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(leftEyeX, eyeY, 23, 17, 0, 0, Math.PI * 2);
  ctx.ellipse(rightEyeX, eyeY, 23, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(leftEyeX, eyeY, 20, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(rightEyeX, eyeY, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(leftEyeX + 1, eyeY, 11, 0, Math.PI * 2);
  ctx.arc(rightEyeX + 1, eyeY, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(leftEyeX + 1, eyeY, 6.5, 0, Math.PI * 2);
  ctx.arc(rightEyeX + 1, eyeY, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeX + 4, eyeY - 4, 3.8, 0, Math.PI * 2);
  ctx.arc(rightEyeX + 4, eyeY - 4, 3.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(170, 85, 45, 0.45)';
  ctx.beginPath();
  ctx.ellipse(128, 140, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(100, 45, 20, 0.6)';
  ctx.beginPath();
  ctx.arc(122, 142, 3, 0, Math.PI * 2);
  ctx.arc(134, 142, 3, 0, Math.PI * 2);
  ctx.fill();

  if (expression === 'smile') {
    ctx.strokeStyle = '#6b2014';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 168, 22, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 169, 16, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.fill();
  } else if (expression === 'determined') {
    ctx.strokeStyle = '#58180d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(108, 178);
    ctx.lineTo(148, 178);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#6b2014';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(128, 174, 16, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();
  }

  if (beardType === 'stubble') {
    for (let i = 0; i < 350; i++) {
      const bx = 55 + ((i * 41) % 146);
      const by = 152 + ((i * 61) % 95);
      ctx.fillStyle = 'rgba(40, 20, 10, 0.55)';
      ctx.fillRect(bx, by, 3, 3);
    }
  } else if (beardType === 'mustache') {
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(128, 150);
    ctx.quadraticCurveTo(80, 150, 56, 174);
    ctx.quadraticCurveTo(95, 174, 128, 162);
    ctx.quadraticCurveTo(161, 174, 200, 174);
    ctx.quadraticCurveTo(176, 150, 128, 150);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (beardType === 'full_beard') {
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(48, 138);
    ctx.lineTo(65, 162);
    ctx.quadraticCurveTo(128, 154, 191, 162);
    ctx.lineTo(208, 138);
    ctx.lineTo(218, 190);
    ctx.quadraticCurveTo(128, 260, 38, 190);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let s = 0; s < 60; s++) {
      const sx = 58 + ((s * 17) % 140);
      const sy = 165 + ((s * 23) % 75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 2, sy + 16);
      ctx.stroke();
    }
  } else if (beardType === 'braid_beard') {
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(48, 138);
    ctx.lineTo(65, 162);
    ctx.quadraticCurveTo(128, 154, 191, 162);
    ctx.lineTo(208, 138);
    ctx.lineTo(218, 190);
    ctx.quadraticCurveTo(128, 260, 38, 190);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(96, 216, 26, 10);
    ctx.fillRect(134, 216, 26, 10);
  }

  return canvas;
}

export function createLeatherCanvas(color = '#452a16'): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  for (let p = 0; p < 1200; p++) {
    const px = (p * 53) % size;
    const py = (p * 89) % size;
    ctx.fillStyle = p % 2 === 0 ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(px, py, 2, 2);
  }

  ctx.strokeStyle = '#e2b368';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(6, 6, size - 12, size - 12);
  ctx.setLineDash([]);

  return canvas;
}

export function createShieldCanvas(bg: string, emblem: 'lion' | 'cross' | 'chevron' | 'tree' | 'skull' | 'bandit' = 'cross'): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = (emblem === 'skull' || emblem === 'bandit') ? '#334155' : '#f59e0b';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  ctx.fillStyle = (emblem === 'skull' || emblem === 'bandit') ? '#cbd5e1' : '#fde047';

  if (emblem === 'skull' || emblem === 'bandit') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 20, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(size / 2 - 22, size / 2 + 10, 44, 28);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(size / 2 - 14, size / 2 - 18, 9, 0, Math.PI * 2);
    ctx.arc(size / 2 + 14, size / 2 - 18, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(size / 2 - 3, size / 2 - 4, 6, 12);

    for (let t = -16; t <= 16; t += 8) {
      ctx.fillRect(size / 2 + t, size / 2 + 24, 4, 14);
    }
  } else if (emblem === 'cross') {
    ctx.fillRect(size / 2 - 16, 24, 32, size - 48);
    ctx.fillRect(24, size / 3, size - 48, 32);
  } else if (emblem === 'chevron') {
    ctx.beginPath();
    ctx.moveTo(24, 160);
    ctx.lineTo(size / 2, 80);
    ctx.lineTo(size - 24, 160);
    ctx.lineTo(size - 24, 195);
    ctx.lineTo(size / 2, 115);
    ctx.lineTo(24, 195);
    ctx.closePath();
    ctx.fill();
  } else if (emblem === 'tree') {
    ctx.fillRect(size / 2 - 8, size / 2 + 10, 16, 45);
    ctx.beginPath();
    ctx.moveTo(size / 2, 45);
    ctx.lineTo(size / 2 + 55, 110);
    ctx.lineTo(size / 2 - 55, 110);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size / 2, 80);
    ctx.lineTo(size / 2 + 65, 150);
    ctx.lineTo(size / 2 - 65, 150);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export function makeTextureFromCanvas(canvas: HTMLCanvasElement, repX = 1, repY = 1): THREE.CanvasTexture {
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

