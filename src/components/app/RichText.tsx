import { Fragment, type ReactNode } from "react";
import { noteDocument, notePlainText, safeNoteLink, type RichTextNode } from "@/lib/rich-text";

function renderNode(node: RichTextNode, interactive: boolean): ReactNode {
  const children = node.content?.map((child, index) => (
    <Fragment key={index}>{renderNode(child, interactive)}</Fragment>
  ));
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = <strong>{text}</strong>;
      else if (mark.type === "italic") text = <em>{text}</em>;
      else if (mark.type === "underline") text = <u>{text}</u>;
      else if (mark.type === "strike") text = <s>{text}</s>;
      else if (mark.type === "code") text = <code>{text}</code>;
      else if (mark.type === "link" && interactive)
        text = (
          <a href={safeNoteLink(mark.attrs?.["href"])} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        );
    }
    return text;
  }
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p>{children || <br />}</p>;
    case "heading":
      return node.attrs?.["level"] === 3 ? <h3>{children}</h3> : <h2>{children}</h2>;
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList":
      return <ol start={Number(node.attrs?.["start"] ?? 1)}>{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre>
          <code>{children}</code>
        </pre>
      );
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr />;
    default:
      return null;
  }
}

export function RichTextView({
  document,
  text,
  interactive = true,
}: {
  document?: unknown;
  text?: string | null;
  interactive?: boolean;
}) {
  const resolved = noteDocument(document, text ?? "");
  const empty =
    !notePlainText(resolved).trim() &&
    (resolved.content ?? []).every((node) => node.type === "paragraph");
  return (
    <div className="rich-note-content">
      {empty ? <span className="record-data-empty">—</span> : renderNode(resolved, interactive)}
    </div>
  );
}
