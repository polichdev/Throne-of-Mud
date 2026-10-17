import fs from 'fs';
import path from 'path';

const filter = process.argv[2] || '';

const fileCounts = {};
const details = {};

function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') {
      scan(p);
    } else if (e.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.includes('translations')) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((l, i) => {
        if (/[\u0400-\u04FF]/.test(l) && !/['"][йцукенгшщзхїфівапролджєячсмитьбю]['"]/.test(l)) {
          fileCounts[p] = (fileCounts[p] || 0) + 1;
          if (!details[p]) details[p] = [];
          details[p].push({ line: i + 1, text: l.trim() });
        }
      });
    }
  }
}

scan('src');

if (!filter) {
  console.log('=== SUMMARY BY FILE ===');
  for (const [f, c] of Object.entries(fileCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`${c.toString().padStart(4)} lines: ${f}`);
  }
} else {
  for (const [f, list] of Object.entries(details)) {
    if (f.toLowerCase().includes(filter.toLowerCase())) {
      console.log(`=== ${f} (${list.length} lines) ===`);
      for (const item of list) {
        console.log(`${item.line}: ${item.text}`);
      }
    }
  }
}
