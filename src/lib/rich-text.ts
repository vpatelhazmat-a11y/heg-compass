export type RichTextNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number>;
  marks?: { type: string; attrs?: Record<string, string> }[];
  content?: RichTextNode[];
};

const nodes = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "text",
]);
const marks = new Set(["bold", "italic", "underline", "strike", "code"]);
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

export function safeNoteLink(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !/^(https?:\/\/|mailto:)/i.test(value) ||
    /\s/.test(value) ||
    Array.from(value).some((character) => character.charCodeAt(0) < 32)
  )
    return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Only documented editor nodes and attributes reach storage or rendering. */
export function sanitizeRichNode(value: unknown, depth = 0): RichTextNode | undefined {
  if (
    !object(value) ||
    depth > 16 ||
    typeof value["type"] !== "string" ||
    !nodes.has(value["type"])
  )
    return undefined;
  const node: RichTextNode = { type: value["type"] };
  if (node.type === "text") {
    if (typeof value["text"] !== "string") return undefined;
    node.text = value["text"].slice(0, 50000);
    if (Array.isArray(value["marks"])) {
      node.marks = value["marks"].slice(0, 10).flatMap((mark) => {
        if (!object(mark) || typeof mark["type"] !== "string") return [];
        if (marks.has(mark["type"])) return [{ type: mark["type"] }];
        const href = object(mark["attrs"]) ? safeNoteLink(mark["attrs"]["href"]) : undefined;
        return mark["type"] === "link" && href ? [{ type: "link", attrs: { href } }] : [];
      });
    }
    return node;
  }
  if (node.type === "heading")
    node.attrs = { level: object(value["attrs"]) && value["attrs"]["level"] === 3 ? 3 : 2 };
  if (node.type === "orderedList")
    node.attrs = {
      start:
        object(value["attrs"]) && Number.isInteger(value["attrs"]["start"])
          ? Math.min(100000, Math.max(1, Number(value["attrs"]["start"])))
          : 1,
    };
  if (Array.isArray(value["content"]))
    node.content = value["content"].slice(0, 1000).flatMap((child) => {
      const clean = sanitizeRichNode(child, depth + 1);
      if (!clean) return [];
      const inline = ["text", "hardBreak"];
      const blocks = [
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "blockquote",
        "codeBlock",
        "horizontalRule",
      ];
      const allowed = ["paragraph", "heading"].includes(node.type)
        ? inline
        : node.type === "codeBlock"
          ? ["text"]
          : ["bulletList", "orderedList"].includes(node.type)
            ? ["listItem"]
            : blocks;
      return allowed.includes(clean.type) ? [clean] : [];
    });
  if (["bulletList", "orderedList"].includes(node.type) && !node.content?.length) return undefined;
  if (node.type === "listItem" && node.content?.[0]?.type !== "paragraph")
    node.content = [{ type: "paragraph" }, ...(node.content ?? [])];
  if (node.type === "blockquote" && !node.content?.length) node.content = [{ type: "paragraph" }];
  return node;
}

export function noteDocument(value: unknown, plainText = ""): RichTextNode {
  const clean = sanitizeRichNode(value);
  if (clean?.type === "doc")
    return { ...clean, content: clean.content?.length ? clean.content : [{ type: "paragraph" }] };
  return {
    type: "doc",
    content: plainText.split(/\r?\n/).map((text) => ({
      type: "paragraph",
      ...(text ? { content: [{ type: "text", text }] } : {}),
    })),
  };
}

export function parseNoteValue(value: unknown): RichTextNode {
  if (typeof value === "string") {
    try {
      return noteDocument(JSON.parse(value), value);
    } catch {
      return noteDocument(undefined, value);
    }
  }
  return noteDocument(value);
}

export function notePlainText(node: RichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const separator = ["doc", "bulletList", "orderedList", "listItem", "blockquote"].includes(
    node.type,
  )
    ? "\n"
    : "";
  return (node.content ?? []).map(notePlainText).join(separator);
}
