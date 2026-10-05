// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RichTextView } from "../src/components/app/RichText";
import RichTextEditor from "../src/components/app/RichTextEditor";
import { noteDocument, notePlainText, safeNoteLink, sanitizeRichNode } from "../src/lib/rich-text";
import { formPayload } from "../src/lib/form-values";

afterEach(cleanup);

test("the notes toolbar edits the document and rejects unsafe link addresses", async () => {
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
  const changed = vi.fn();
  render(
    <RichTextEditor
      id="note-editor"
      label="Notes"
      value={JSON.stringify(noteDocument(undefined, "Review notes"))}
      onChange={changed}
    />,
  );
  expect(await screen.findByRole("textbox", { name: "Notes" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Heading" }));
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(JSON.parse(changed.mock.calls.at(-1)![0]).content[0].type).toBe("heading");
  fireEvent.click(screen.getByRole("button", { name: "Link" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Link address" }), {
    target: { value: "javascript:alert(1)" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByRole("alert").textContent).toContain("Enter an http");
});

test("legacy notes preserve literal text and line breaks without treating HTML as markup", () => {
  const text = "First line\n<script>alert('x')</script>";
  expect(notePlainText(noteDocument(undefined, text))).toBe(text);
  const { container } = render(<RichTextView text={text} />);
  expect(container.querySelector("script")).toBeNull();
  expect(screen.getByText("<script>alert('x')</script>")).toBeTruthy();
});

test("rich notes remove executable links, unknown nodes and arbitrary attributes", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { onclick: "alert(1)" },
        content: [
          {
            type: "text",
            text: "Safe text",
            marks: [{ type: "bold" }, { type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      },
      { type: "script", text: "bad" },
    ],
  };
  const clean = sanitizeRichNode(document)!;
  expect(clean.content).toHaveLength(1);
  expect(clean.content?.[0]?.attrs).toBeUndefined();
  const { container } = render(<RichTextView document={clean} />);
  expect(container.querySelector("strong")?.textContent).toBe("Safe text");
  expect(container.querySelector("a")).toBeNull();
  expect(safeNoteLink("data:text/html,test")).toBeUndefined();
  expect(safeNoteLink("https://example.test/a")).toBe("https://example.test/a");
});

test("rich-note payloads keep readable text for search and export alongside sanitized formatting", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Annual review", marks: [{ type: "bold" }] }],
      },
    ],
  };
  const payload = formPayload(
    [{ name: "notes", label: "Notes", type: "richtext" }],
    { notes: JSON.stringify(document) },
    true,
  );
  expect(payload["notes"]).toBe("Annual review");
  expect(payload["rich_text"]).toEqual({ notes: document });
});
