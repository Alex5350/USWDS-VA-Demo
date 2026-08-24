"use client";

import { parseChatMarkdown, type ChatMarkdownBlock } from "@/lib/chat-markdown";

type ChatMarkdownProps = {
  text: string;
};

export function ChatMarkdown({ text }: ChatMarkdownProps) {
  const blocks = parseChatMarkdown(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="chat-markdown">
      {blocks.map((block, index) => (
        <MarkdownBlock block={block} key={`${block.type}-${index}`} />
      ))}
    </div>
  );
}

function MarkdownBlock({ block }: { block: ChatMarkdownBlock }) {
  if (block.type === "heading") {
    return <h4 className="chat-markdown__heading">{block.text}</h4>;
  }

  if (block.type === "list") {
    return (
      <ul className="chat-markdown__list">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "table") {
    return (
      <div className="chat-markdown__table-wrap">
        <table className="chat-markdown__table">
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th className={isNumericValue(header) ? "chat-markdown__cell--numeric" : undefined} key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${row.join("|")}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    className={isNumericValue(cell) ? "chat-markdown__cell--numeric" : undefined}
                    key={`${cell}-${cellIndex}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p className="chat-markdown__paragraph">{block.text}</p>;
}

function isNumericValue(value: string) {
  return /^[$(]?\d[\d,]*(?:\.\d+)?%?\)?$/.test(value.trim());
}
