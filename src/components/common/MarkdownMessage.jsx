import React from 'react';
import styles from './MarkdownMessage.module.css';

const splitTableRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
const isTableSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const isListItem = (line) => /^\s*(?:[-+*]|\d+\.)\s+/.test(line);

function renderInline(text, keyPrefix = 'inline') {
  const tokens = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if (token.startsWith('**') && token.endsWith('**')) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith('__') && token.endsWith('__')) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith('~~') && token.endsWith('~~')) return <del key={key}>{token.slice(2, -2)}</del>;
    if (token.startsWith('`') && token.endsWith('`')) return <code key={key}>{token.slice(1, -1)}</code>;
    if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    return token.split(/(\n|\uE000)/).flatMap((part, partIndex) => part === '\n' || part === '\uE000'
      ? [<br key={`${key}-br-${partIndex}`} />]
      : [part]);
  });
}

export default function MarkdownMessage({ content = '' }) {
  const normalized = String(content)
    .replace(/<\/?br\s*\/?>/gi, '\uE000')
    .replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    if (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className={styles.tableWrap} key={`table-${index}`}>
          <table className={styles.table}>
            <thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{renderInline(cell, `th-${index}-${cellIndex}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{headers.map((_, cellIndex) => (
                <td key={cellIndex}>{renderInline(row[cellIndex] || '', `td-${index}-${rowIndex}-${cellIndex}`)}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const HeadingTag = `h${level + 2}`;
      blocks.push(<HeadingTag key={`heading-${index}`}>{renderInline(heading[2], `heading-${index}`)}</HeadingTag>);
      index += 1;
      continue;
    }

    if (isListItem(lines[index])) {
      const ordered = /^\s*\d+\./.test(lines[index]);
      const ListTag = ordered ? 'ol' : 'ul';
      const items = [];
      while (index < lines.length && isListItem(lines[index]) && /^\s*\d+\./.test(lines[index]) === ordered) {
        items.push(lines[index].replace(/^\s*(?:[-+*]|\d+\.)\s+/, ''));
        index += 1;
      }
      blocks.push(<ListTag key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `list-${index}-${itemIndex}`)}</li>)}</ListTag>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index]) && !isListItem(lines[index])) {
      if (index + 1 < lines.length && lines[index].includes('|') && isTableSeparator(lines[index + 1])) break;
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderInline(paragraph.join(' '), `paragraph-${index}`)}</p>);
  }

  return <div className={styles.markdownMessage}>{blocks}</div>;
}
