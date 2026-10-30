"use client";

import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./code-editor";
import { languages, type Language } from "@/lib/languages";
import { runCode } from "@/lib/run-code";
import {
  isTheme,
  themeStorageKey,
  type Theme,
  type DarkTheme,
} from "@/lib/themes";

type Status = "ready" | "running" | "completed" | "error";
type Entry = { id: number; time: string; status: Status; message: string };
const statusLabels: Record<Status, string> = {
  ready: "준비",
  running: "미리보기 실행 중",
  completed: "미리보기 완료",
  error: "오류",
};
const storageKey = (language: Language) => `code-desk:v1:${language}`;

export function Workspace() {
  const [theme, setTheme] = useState<Theme>("light");
  const lastDarkTheme = useRef<DarkTheme>("rider-dark");
  const [language, setLanguage] = useState<Language>("python");
  const [documents, setDocuments] = useState({
    python: languages.python.sample,
    csharp: languages.csharp.sample,
  });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [status, setStatus] = useState<Status>("ready");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const nextId = useRef(0);
  const running = useRef(false);
  const logBody = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setDocuments({
        python:
          localStorage.getItem(storageKey("python")) ?? languages.python.sample,
        csharp:
          localStorage.getItem(storageKey("csharp")) ?? languages.csharp.sample,
      });
    } catch {
      setSaved(false);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(themeStorageKey);
      const restored = isTheme(stored)
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "rider-dark"
          : "light";
      setTheme(restored);
      document.documentElement.dataset.theme = restored;
      if (restored !== "light") lastDarkTheme.current = restored;
    } catch {
      /* Theme remains usable when storage is unavailable. */
    }
    function preventBrowserSave(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.code === "KeyS" &&
        !event.altKey
      ) {
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", preventBrowserSave, true);
    return () =>
      window.removeEventListener("keydown", preventBrowserSave, true);
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    if (next !== "light") lastDarkTheme.current = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      /* Keep theme in memory. */
    }
  }

  useEffect(() => {
    if (logBody.current)
      logBody.current.scrollTop = logBody.current.scrollHeight;
  }, [entries, expanded]);

  function updateCode(code: string) {
    setDocuments((current) => ({ ...current, [language]: code }));
    try {
      localStorage.setItem(storageKey(language), code);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function append(status: Status, message: string) {
    const entry = {
      id: nextId.current++,
      time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
      status,
      message,
    };
    setEntries((current) => [...current.slice(-99), entry]);
  }

  async function handleRun() {
    if (running.current || !loaded) return;
    running.current = true;
    setExpanded(true);
    setStatus("running");
    append(
      "running",
      `${languages[language].name} · 실행 서버 미연결 — UI 미리보기`,
    );
    try {
      const result = await runCode({ language, code: documents[language] });
      if (result.mode !== "preview")
        throw new Error("미리보기 응답이 아닙니다.");
      setStatus("completed");
      append(
        "completed",
        `${result.message}\n미리보기가 완료되었습니다. 코드는 실행되지 않았습니다.`,
      );
    } catch {
      setStatus("error");
      append(
        "error",
        "UI 미리보기 처리 중 오류가 발생했습니다. 다시 시도해 주세요. 코드는 실행되지 않았습니다.",
      );
    } finally {
      running.current = false;
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Code Desk 홈">
          <span className="brand-icon" aria-hidden="true">
            ⌘
          </span>
          <span>
            code<span className="brand-light">desk</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <span className="workspace-label">나만의 풀이 공간</span>
        <div className="toolbar">
          <div className="theme-control">
            <button
              className="mode-button"
              aria-label={
                theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"
              }
              onClick={() =>
                changeTheme(theme === "light" ? lastDarkTheme.current : "light")
              }
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
            <label className="visually-hidden" htmlFor="theme">
              화면 테마
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(event) => {
                if (isTheme(event.target.value))
                  changeTheme(event.target.value);
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="rider-dark">Rider Dark</option>
              <option value="dracula">Dracula</option>
            </select>
          </div>
          <div className="language-control">
            <label htmlFor="language">언어</label>
            <select
              id="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              disabled={!loaded}
            >
              <option value="python">Python</option>
              <option value="csharp">C#</option>
            </select>
          </div>
          <button
            className="run-button"
            onClick={handleRun}
            disabled={!loaded || status === "running"}
          >
            <span aria-hidden="true">{status === "running" ? "◌" : "▷"}</span>
            {status === "running" ? "미리보기 중…" : "실행 미리보기"}
          </button>
        </div>
      </header>

      <main aria-label="코딩 작업 공간">
        <div className="workspace-grid">
          <section className="editor-panel" aria-label="코드 편집 영역">
            <div className="panel-header">
              <div className="file-tab">
                <span className="file-icon" aria-hidden="true">
                  {language === "python" ? "Py" : "C#"}
                </span>
                {languages[language].file}
                <span className="file-dot" />
              </div>
              <span className="editor-label">코드 편집기</span>
            </div>
            <div className="editor-content">
              {loaded ? (
                <CodeEditor
                  key={language}
                  language={language}
                  theme={theme}
                  initialCode={documents[language]}
                  onChange={updateCode}
                  onCursor={(line, column) => setCursor({ line, column })}
                />
              ) : (
                <p className="loading-message">저장된 코드를 불러오는 중…</p>
              )}
            </div>
            <div className="editor-status">
              <span className={saved ? "save-status" : "save-warning"}>
                {!loaded
                  ? "불러오는 중"
                  : saved
                    ? "✓ 이 브라우저에 자동 저장"
                    : "저장 불가 · 현재 탭에서만 유지"}
              </span>
              <div>
                <span>
                  Ln {cursor.line}, Col {cursor.column}
                </span>
                <span>공백: 4</span>
                <span>UTF-8</span>
              </div>
            </div>
          </section>

          <section
            className={`logs-panel ${expanded ? "is-expanded" : "is-collapsed"}`}
            aria-label="실행 로그 영역"
          >
            <div className="panel-header logs-header">
              <h2>
                <span aria-hidden="true">›_</span> 실행 로그{" "}
                <span className="log-count">{entries.length}</span>
              </h2>
              <div className="log-actions">
                <button
                  className="clear-button"
                  onClick={() => {
                    setEntries([]);
                    setStatus("ready");
                  }}
                  disabled={!entries.length || status === "running"}
                  aria-label="실행 로그 지우기"
                >
                  지우기
                </button>
                <button
                  className="collapse-button"
                  aria-expanded={expanded}
                  aria-controls="log-content"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? "접기 −" : "펼치기 +"}
                </button>
              </div>
            </div>
            <div id="log-content" className="log-content">
              <div className="log-state">
                <span className={`status-pill ${status}`} role="status">
                  <span />
                  {statusLabels[status]}
                </span>
                <span>PREVIEW</span>
              </div>
              <div
                className="log-body"
                ref={logBody}
                role="log"
                aria-label="미리보기 실행 기록"
                aria-live="polite"
                aria-relevant="additions"
              >
                {entries.length === 0 ? (
                  <div className="empty-logs">
                    <div className="terminal-icon" aria-hidden="true">
                      &gt;_
                    </div>
                    <h3>첫 번째 아이디어를 적어보세요</h3>
                    <p>
                      코드를 작성하고 <strong>실행 미리보기</strong>를 누르면
                      <br />
                      이곳에서 상태를 확인할 수 있어요.
                    </p>
                    <span className="empty-divider" />
                    <p className="empty-note">
                      아직 실제 코드 실행은 지원하지 않아요.
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <article
                      key={entry.id}
                      className={`log-entry ${entry.status}`}
                    >
                      <div>
                        <span className="entry-label">
                          {statusLabels[entry.status]}
                        </span>
                        <time>{entry.time}</time>
                      </div>
                      <p>{entry.message}</p>
                    </article>
                  ))
                )}
              </div>
              <div className="preview-notice">
                <span aria-hidden="true">ⓘ</span>
                <div>
                  <strong>실행 서버 미연결 — UI 미리보기</strong>
                  <p>코드 실행 및 컴파일 결과가 아닙니다.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <footer className="workspace-footer">
          <span>
            <span className="footer-dot" /> 마음 편히, 나만의 속도로.
          </span>
          <span>
            Tab 들여쓰기 <span className="footer-separator">/</span> Esc → Tab
            편집기 밖으로 이동
          </span>
        </footer>
      </main>
    </div>
  );
}
