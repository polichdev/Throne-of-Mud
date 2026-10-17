import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export function removeCommentsFromSource(sourceText, isJsx) {
  const sf = ts.createSourceFile(
    isJsx ? 'file.tsx' : 'file.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const ranges = [];
  const seen = new Set();
  function addRange(c) {
    const key = `${c.pos}-${c.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      ranges.push(c);
    }
  }

  if (isJsx) {
    function visitJsx(node) {
      if (ts.isJsxExpression(node) && !node.expression) {
        addRange({ pos: node.getStart(sf), end: node.end });
      }
      ts.forEachChild(node, visitJsx);
    }
    visitJsx(sf);
  }

  function visitTokens(node) {
    const leading = ts.getLeadingCommentRanges(sf.text, node.pos);
    if (leading) {
      for (const c of leading) addRange(c);
    }
    const trailing = ts.getTrailingCommentRanges(sf.text, node.end);
    if (trailing) {
      for (const c of trailing) addRange(c);
    }
    try {
      const children = node.getChildren(sf);
      for (const child of children) {
        visitTokens(child);
      }
    } catch {
      ts.forEachChild(node, visitTokens);
    }
  }

  const rootLeading = ts.getLeadingCommentRanges(sf.text, 0);
  if (rootLeading) {
    for (const c of rootLeading) addRange(c);
  }
  const rootTrailing = ts.getTrailingCommentRanges(sf.text, sf.end);
  if (rootTrailing) {
    for (const c of rootTrailing) addRange(c);
  }

  visitTokens(sf);

  if (ranges.length === 0) return sourceText;

  const filteredRanges = [];
  for (const r of ranges) {
    const isContained = ranges.some(
      (other) => other !== r && other.pos <= r.pos && other.end >= r.end
    );
    if (!isContained) {
      filteredRanges.push(r);
    }
  }

  filteredRanges.sort((a, b) => b.pos - a.pos);

  let result = sourceText;
  for (const r of filteredRanges) {
    let start = r.pos;
    let end = r.end;

    const beforeOnLine = result.slice(0, start);
    const lastNewlineBefore = beforeOnLine.lastIndexOf('\n');
    const linePrefix =
      lastNewlineBefore === -1 ? beforeOnLine : beforeOnLine.slice(lastNewlineBefore + 1);

    const isOnlyWhitespaceBefore = /^\s*$/.test(linePrefix);

    const afterOnLine = result.slice(end);
    const nextNewlineIndex = afterOnLine.indexOf('\n');
    const lineSuffix =
      nextNewlineIndex === -1 ? afterOnLine : afterOnLine.slice(0, nextNewlineIndex);

    if (isOnlyWhitespaceBefore && /^\r?$/.test(lineSuffix)) {
      start = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
      end = nextNewlineIndex === -1 ? result.length : end + nextNewlineIndex + 1;
    } else if (isOnlyWhitespaceBefore) {
      // Line starts with spaces, followed by code
    } else {
      const trimmedPrefix = linePrefix.replace(/[ \t]+$/, '');
      start = (lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1) + trimmedPrefix.length;
    }

    result = result.slice(0, start) + result.slice(end);
  }

  // Reduce excessive empty lines (3+ newlines -> 2)
  result = result.replace(/(\r?\n){3,}/g, '\n\n');

  // Trim start whitespace if file starts with blank lines after header comment removal
  result = result.replace(/^\s*\n/, '');

  return result;
}

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      results = results.concat(walk(p));
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      results.push(p);
    }
  }
  return results;
}

const files = walk('src');
let modifiedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const isJsx = file.endsWith('.tsx');
  const stripped = removeCommentsFromSource(content, isJsx);
  if (stripped !== content) {
    fs.writeFileSync(file, stripped, 'utf8');
    modifiedCount++;
  }
}

console.log(`Processed ${files.length} files. Stripped comments from ${modifiedCount} files.`);
