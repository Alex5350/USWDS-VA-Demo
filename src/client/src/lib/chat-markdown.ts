export type ChatMarkdownBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

const headingPattern = /^(#{1,4})\s+(.+)$/;
const bulletPattern = /^[-*]\s+(.+)$/;
const tableSeparatorCellPattern = /^:?-{3,}:?$/;

export function parseChatMarkdown(markdown: string): ChatMarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ChatMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      index += 1;
      continue;
    }

    const heading = headingPattern.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: cleanInlineText(heading[2])
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = parseTable(lines, index);
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    const bullet = bulletPattern.exec(line);
    if (bullet) {
      const items: string[] = [];

      while (index < lines.length) {
        const nextBullet = bulletPattern.exec(lines[index]?.trim() ?? "");

        if (!nextBullet) {
          break;
        }

        items.push(cleanInlineText(nextBullet[1]));
        index += 1;
      }

      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const nextLine = lines[index]?.trim() ?? "";

      if (
        !nextLine ||
        headingPattern.test(nextLine) ||
        bulletPattern.test(nextLine) ||
        isTableStart(lines, index)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: cleanInlineText(paragraphLines.join(" "))
      });
    }
  }

  return blocks;
}

function isTableStart(lines: string[], index: number) {
  const header = parseTableRow(lines[index] ?? "");
  const separator = parseTableRow(lines[index + 1] ?? "");

  return (
    header.length > 1 &&
    separator.length === header.length &&
    separator.every((cell) => tableSeparatorCellPattern.test(cell.trim()))
  );
}

function parseTable(lines: string[], index: number) {
  const headers = parseTableRow(lines[index] ?? "").map(cleanInlineText);
  const rows: string[][] = [];
  index += 2;

  while (index < lines.length) {
    const cells = parseTableRow(lines[index] ?? "");

    if (cells.length !== headers.length) {
      break;
    }

    rows.push(cells.map(cleanInlineText));
    index += 1;
  }

  return {
    block: {
      type: "table" as const,
      headers,
      rows
    },
    nextIndex: index
  };
}

function parseTableRow(row: string) {
  const trimmed = row.trim();

  if (!trimmed.includes("|")) {
    return [];
  }

  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function cleanInlineText(value: string) {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}
