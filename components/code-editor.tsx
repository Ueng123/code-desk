"use client";

import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
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
  HighlightStyle,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { tags } from "@lezer/highlight";
import { syntaxPalettes, type Theme } from "@/lib/themes";
import type { Language } from "@/lib/languages";

interface Props {
  language: Language;
  theme: Theme;
  initialCode: string;
  onChange: (code: string) => void;
  onCursor: (line: number, column: number) => void;
}

function editorAppearance(theme: Theme) {
  const palette = syntaxPalettes[theme];
  return [
    EditorView.theme({}, { dark: theme !== "light" }),
    syntaxHighlighting(
      HighlightStyle.define([
        { tag: tags.keyword, color: palette.keyword },
        { tag: [tags.string, tags.regexp], color: palette.string },
        { tag: [tags.number, tags.bool, tags.null], color: palette.number },
        { tag: tags.comment, color: palette.comment, fontStyle: "italic" },
        { tag: tags.function(tags.variableName), color: palette.function },
        {
          tag: [tags.typeName, tags.className, tags.namespace],
          color: palette.type,
        },
        {
          tag: [tags.variableName, tags.propertyName],
          color: palette.variable,
        },
        { tag: tags.operator, color: palette.keyword },
      ]),
    ),
  ];
}

// Parent keys this component by language, preserving each document independently.
export function CodeEditor({
  language,
  theme,
  initialCode,
  onChange,
  onCursor,
}: Props) {
  const viewRef = useRef<EditorView | null>(null);
  const appearance = useRef(new Compartment());
  const initialTheme = useRef(theme);
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
          appearance.current.of(editorAppearance(initialTheme.current)),
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
            "&": {
              height: "100%",
              fontSize: "15px",
              backgroundColor: "var(--editor-bg)",
              color: "var(--ink)",
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.85",
            },
            ".cm-content": {
              padding: "22px 0",
              minHeight: "100%",
              caretColor: "var(--editor-caret)",
            },
            ".cm-line": { padding: "0 24px 0 16px" },
            ".cm-gutters": {
              background: "var(--editor-bg)",
              color: "var(--editor-gutter)",
              border: "none",
              padding: "22px 0 22px 12px",
            },
            ".cm-activeLine, .cm-activeLineGutter": {
              background: "var(--editor-active)",
            },
            "&.cm-focused": { outline: "none" },
            "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
              background: "var(--editor-selection)",
            },
            ".cm-matchingBracket": {
              background: "var(--editor-match)",
              outline: "1px solid var(--green)",
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    callbacks.current.onCursor(1, 1);
    return () => {
      viewRef.current = null;
      view.destroy();
    };
    // The initial document is read only when this language's editor mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: appearance.current.reconfigure(editorAppearance(theme)),
    });
  }, [theme]);
  return <div className="editor-host" ref={host} />;
}
