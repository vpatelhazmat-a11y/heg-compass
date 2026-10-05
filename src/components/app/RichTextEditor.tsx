import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import { noteDocument, parseNoteValue, safeNoteLink, sanitizeRichNode } from "@/lib/rich-text";

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  autoFocus = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: false,
          isAllowedUri: (href) => Boolean(safeNoteLink(href)),
        },
      }),
    ],
    content: parseNoteValue(value),
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        class: "rich-note-content rich-note-input",
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange(JSON.stringify(noteDocument(sanitizeRichNode(current.getJSON())))),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      heading: current?.isActive("heading") ?? false,
      bullets: current?.isActive("bulletList") ?? false,
      numbered: current?.isActive("orderedList") ?? false,
    }),
  });
  if (!editor) return <div className="rich-note-loading">Loading editor…</div>;
  const tools = [
    {
      label: "Bold",
      icon: Bold,
      active: state?.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: state?.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      active: state?.heading,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet list",
      icon: List,
      active: state?.bullets,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: state?.numbered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Link",
      icon: Link,
      active: linking,
      run: () => {
        setUrl(String(editor.getAttributes("link")["href"] ?? ""));
        setLinkError("");
        setLinking(!linking);
      },
    },
    { label: "Undo", icon: Undo2, run: () => editor.chain().focus().undo().run() },
    { label: "Redo", icon: Redo2, run: () => editor.chain().focus().redo().run() },
  ];
  return (
    <div className="rich-note-editor">
      <div className="rich-note-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={tool.active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.run}
          >
            <tool.icon className="h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>
      {linking && (
        <div className="rich-note-link">
          <input
            aria-label="Link address"
            placeholder="https://…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              const href = safeNoteLink(url.trim());
              if (!href) {
                setLinkError("Enter an http, https, or email link.");
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
              setLinking(false);
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setLinking(false);
            }}
          >
            Remove
          </button>
          {linkError && <span role="alert">{linkError}</span>}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
