"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
  StreamLanguage,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import type { Language } from "@/lib/languages";

interface Props {
  language: Language;
  initialCode: string;
  onChange: (code: string) => void;
  onCursor: (line: number, column: number) => void;
}

// Parent keys this component by language, preserving each document independently.
export function CodeEditor({
  language,
  initialCode,
  onChange,
  onCursor,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onCursor });
  useEffect(() => {
    callbacks.current = { onChange, onCursor };
  }, [onChange, onCursor]);
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialCode,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          indentUnit.of("    "),
          syntaxHighlighting(defaultHighlightStyle),
          language === "python" ? python() : StreamLanguage.define(csharp),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.contentAttributes.of({
            "aria-label": `${language === "python" ? "Python" : "C#"} 코드 편집기`,
            autocapitalize: "off",
            autocorrect: "off",
            spellcheck: "false",
            inputmode: "text",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callbacks.current.onChange(update.state.doc.toString());
            if (update.selectionSet || update.docChanged) {
              const position = update.state.selection.main.head;
              const line = update.state.doc.lineAt(position);
              callbacks.current.onCursor(line.number, position - line.from + 1);
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "15px" },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.85",
            },
            ".cm-content": {
              padding: "22px 0",
              minHeight: "100%",
              caretColor: "#167660",
            },
            ".cm-line": { padding: "0 24px 0 16px" },
            ".cm-gutters": {
              background: "#fcfdfc",
              color: "#a0aaa6",
              border: "none",
              padding: "22px 0 22px 12px",
            },
            ".cm-activeLine, .cm-activeLineGutter": { background: "#f0f6f3" },
            "&.cm-focused": { outline: "none" },
            "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
              background: "#d4e9df",
            },
            ".cm-matchingBracket": {
              background: "#d5ecdf",
              outline: "1px solid #82b89c",
            },
          }),
        ],
      }),
    });
    callbacks.current.onCursor(1, 1);
    return () => view.destroy();
    // The initial document is read only when this language's editor mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  return <div className="editor-host" ref={host} />;
}
