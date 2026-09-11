"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import {
  FontSize,
  TextStyle,
} from "@tiptap/extension-text-style";

import {
  normalizeServiceRichTextDocument,
  type ServiceRichTextDocument,
} from "@/lib/serviceRichText";

type Props = {
  value: ServiceRichTextDocument;
  onChange: (
    value: ServiceRichTextDocument,
  ) => void;
  disabled?: boolean;
  minHeightClass?: string;
};

export function ServiceRichTextEditor({
  value,
  onChange,
  disabled = false,
  minHeightClass = "min-h-[220px]",
}: Props) {
  const onChangeReference =
    useRef(onChange);

  const [revision, setRevision] =
    useState(0);

  useEffect(() => {
    onChangeReference.current =
      onChange;
  }, [onChange]);

  const editor =
    useEditor({
      extensions: [
        StarterKit,
        TextStyle,
        FontSize,
      ],

      content:
        normalizeServiceRichTextDocument(
          value,
        ),

      immediatelyRender:
        false,

      editable:
        !disabled,

      onUpdate: ({
        editor: currentEditor,
      }) => {
        onChangeReference.current(
          normalizeServiceRichTextDocument(
            currentEditor.getJSON(),
          ),
        );
      },

      onSelectionUpdate: () => {
        setRevision(
          (current) =>
            current + 1,
        );
      },
    });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(
      !disabled,
    );
  }, [
    editor,
    disabled,
  ]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const incoming =
      normalizeServiceRichTextDocument(
        value,
      );

    const current =
      normalizeServiceRichTextDocument(
        editor.getJSON(),
      );

    if (
      JSON.stringify(incoming) ===
      JSON.stringify(current)
    ) {
      return;
    }

    editor.commands.setContent(
      incoming,
      {
        emitUpdate:
          false,
      },
    );
  }, [
    editor,
    value,
  ]);

  if (!editor) {
    return (
      <div
        className={`rounded-lg border border-[#d8e4df] bg-white ${minHeightClass}`}
      />
    );
  }

  const activeFontSize =
    editor.getAttributes(
      "textStyle",
    ).fontSize as
      | string
      | undefined;

  void revision;

  function applyFontSize(
    fontSize: string,
  ) {
    if (!editor) {
      return;
    }

    if (!fontSize) {
      editor
        .chain()
        .focus()
        .unsetFontSize()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .setFontSize(
        fontSize,
      )
      .run();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d8e4df] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e2eae6] bg-[#f7faf8] p-2.5">
        <button
          type="button"
          disabled={disabled}
          aria-label="Bold selected text"
          aria-pressed={
            editor.isActive(
              "bold",
            )
          }
          onMouseDown={(
            event,
          ) => {
            event.preventDefault();

            editor
              .chain()
              .focus()
              .toggleBold()
              .run();
          }}
          className={`min-h-9 min-w-9 rounded-md border px-3 text-sm font-black transition ${
            editor.isActive(
              "bold",
            )
              ? "border-[#0a9c63] bg-[#e9f7f0] text-[#0a7f55]"
              : "border-[#d7e4df] bg-white text-[#435b65] hover:bg-[#f1f6f3]"
          }`}
        >
          B
        </button>

        <button
          type="button"
          disabled={disabled}
          aria-label="Italicize selected text"
          aria-pressed={
            editor.isActive(
              "italic",
            )
          }
          onMouseDown={(
            event,
          ) => {
            event.preventDefault();

            editor
              .chain()
              .focus()
              .toggleItalic()
              .run();
          }}
          className={`min-h-9 min-w-9 rounded-md border px-3 text-sm font-semibold italic transition ${
            editor.isActive(
              "italic",
            )
              ? "border-[#0a9c63] bg-[#e9f7f0] text-[#0a7f55]"
              : "border-[#d7e4df] bg-white text-[#435b65] hover:bg-[#f1f6f3]"
          }`}
        >
          I
        </button>

        <div className="mx-1 h-6 w-px bg-[#dce6e1]" />

        <select
          disabled={disabled}
          aria-label="Selected text size"
          value={
            activeFontSize ??
            ""
          }
          onChange={(
            event,
          ) =>
            applyFontSize(
              event.target.value,
            )
          }
          className="min-h-9 rounded-md border border-[#d7e4df] bg-white px-3 text-xs font-bold text-[#435b65] outline-none focus:border-[#0a9c63]"
        >
          <option value="">
            Normal
          </option>

          <option value="13px">
            Small
          </option>

          <option value="18px">
            Large
          </option>
        </select>

        <span className="ml-auto hidden text-[10px] font-bold uppercase tracking-[.08em] text-[#8a9a93] sm:inline">
          Select text, then format
        </span>
      </div>

      <EditorContent
        editor={editor}
        className={`service-rich-editor ${minHeightClass} [&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:w-full [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4 [&_.ProseMirror]:text-[15px] [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-[#17313d] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_p:first-child]:mt-0 [&_.ProseMirror_p:last-child]:mb-0`}
      />
    </div>
  );
}
