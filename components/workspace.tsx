"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Icon } from "./icon";
import { CodeEditor } from "./code-editor";
import { languages, type Language } from "@/lib/languages";
import { runCode } from "@/lib/run-code";
import {
  isTheme,
  isDarkTheme,
  themes,
  themeStorageKey,
  type Theme,
  type DarkTheme,
} from "@/lib/themes";

type Status = "ready" | "running" | "completed" | "error";
type Entry = { id: number; time: string; status: Status; message: string };
const statusLabels: Record<Status, string> = {
  ready: "준비",
  running: "실행 중",
  completed: "완료",
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
  const [metrics, setMetrics] = useState<{
    durationMs: number;
    outputBytes: number;
  } | null>(null);
  const [logMode, setLogMode] = useState<"full" | "split" | "hidden">("split");
  const [logShare, setLogShare] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(
      "(orientation: portrait), (max-width: 760px)",
    );
    const update = () => setStacked(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const workspace = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    vertical: boolean;
    initial: number;
  } | null>(null);

  function selectLogMode(mode: "full" | "split" | "hidden") {
    if (mode === "split") setLogShare(0.5);
    setLogMode(mode);
  }
  function finishResize(share: number, size: number) {
    setLogShare(share);
    if (share >= 0.9) setLogMode("full");
    else if (share * size <= Math.max(size * 0.1, 66)) setLogMode("hidden");
  }
  function pointerShare(
    event: PointerEvent<HTMLDivElement>,
    vertical: boolean,
  ) {
    const bounds = workspace.current!.getBoundingClientRect();
    const size = vertical ? bounds.height : bounds.width;
    const offset = vertical
      ? event.clientY - bounds.top
      : event.clientX - bounds.left;
    return {
      share: Math.max(0, Math.min(1, 1 - offset / Math.max(1, size))),
      size,
    };
  }
  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || !workspace.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      vertical: getComputedStyle(workspace.current).display === "flex",
      initial: logShare,
    };
    setDragging(true);
  }
  function moveResize(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    setLogShare(pointerShare(event, drag.current.vertical).share);
  }
  function stopResize(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (cancelled) setLogShare(current.initial);
    else {
      const { share, size } = pointerShare(event, current.vertical);
      finishResize(share, size);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  useEffect(() => {
    function cancelResize() {
      if (drag.current) {
        setLogShare(drag.current.initial);
        drag.current = null;
        setDragging(false);
      }
    }
    window.addEventListener("resize", cancelResize);
    return () => window.removeEventListener("resize", cancelResize);
  }, []);
  const expanded = logMode !== "hidden";
  const [fontSize, setFontSize] = useState(15);
  const [fontInput, setFontInput] = useState("15");
  function changeFontSize(value: number) {
    const size = Math.min(32, Math.max(10, Math.round(value)));
    setFontSize(size);
    setFontInput(String(size));
    try {
      localStorage.setItem("code-desk:v1:font-size", String(size));
    } catch {
      /* In-memory fallback. */
    }
  }
  useEffect(() => {
    try {
      const value = Number(localStorage.getItem("code-desk:v1:font-size"));
      if (Number.isFinite(value) && value >= 10 && value <= 32) {
        setFontSize(Math.round(value));
        setFontInput(String(Math.round(value)));
      }
    } catch {
      /* Use the default size. */
    }
  }, []);
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
      document.documentElement.dataset.mode = isDarkTheme(restored)
        ? "dark"
        : "light";
      if (isDarkTheme(restored)) lastDarkTheme.current = restored;
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
    document.documentElement.dataset.mode = isDarkTheme(next)
      ? "dark"
      : "light";
    if (isDarkTheme(next)) lastDarkTheme.current = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      /* Keep theme in memory. */
    }
  }

  useEffect(() => {
    if (logBody.current)
      logBody.current.scrollTop = logBody.current.scrollHeight;
  }, [entries, logMode]);

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
    if (logMode === "hidden") selectLogMode("split");
    setStatus("running");
    setMetrics(null);
    const runLanguage = languages[language].name;
    append("running", `${runLanguage} · 실행 환경 준비 및 코드 실행 중…`);
    try {
      const result = await runCode({ language, code: documents[language] });
      setStatus(result.status);
      if (result.durationMs !== undefined && result.outputBytes !== undefined)
        setMetrics({
          durationMs: result.durationMs,
          outputBytes: result.outputBytes,
        });
      if (result.stdout)
        append(result.status, `[${runLanguage} stdout]\n${result.stdout}`);
      if (result.stderr)
        append("error", `[${runLanguage} stderr]\n${result.stderr}`);
      append(
        result.status,
        `${runLanguage} · ${result.status === "completed" ? "실행 완료" : "실행 실패"} · 종료 코드: ${result.exitCode ?? "없음"}`,
      );
    } catch {
      setStatus("error");
      append(
        "error",
        "실행 서버에 연결하지 못했거나 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
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
            <Icon name="command" />
          </span>
          <span>
            code<span className="brand-light">desk</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <span className="workspace-label">나만의 풀이 공간</span>
        <div className="toolbar">
          <div
            className="font-control"
            role="group"
            aria-label="코드 글자 크기"
          >
            <button
              type="button"
              aria-label="코드 글자 축소"
              onClick={() => changeFontSize(fontSize - 1)}
              disabled={fontSize <= 10}
            >
              A−
            </button>
            <label className="visually-hidden" htmlFor="code-font-size">
              코드 글자 크기 (px)
            </label>
            <input
              id="code-font-size"
              type="number"
              inputMode="numeric"
              min="10"
              max="32"
              step="1"
              value={fontInput}
              onChange={(event) => {
                const value = event.target.value;
                setFontInput(value);
                const size = Number(value);
                if (
                  value &&
                  Number.isInteger(size) &&
                  size >= 10 &&
                  size <= 32
                ) {
                  setFontSize(size);
                  try {
                    localStorage.setItem("code-desk:v1:font-size", value);
                  } catch {
                    /* In-memory fallback. */
                  }
                }
              }}
              onBlur={() =>
                changeFontSize(
                  fontInput.trim() && Number.isFinite(Number(fontInput))
                    ? Number(fontInput)
                    : fontSize,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
            <span aria-hidden="true">px</span>
            <button
              type="button"
              aria-label="코드 글자 확대"
              onClick={() => changeFontSize(fontSize + 1)}
              disabled={fontSize >= 32}
            >
              A+
            </button>
          </div>
          <div className="theme-control">
            <button
              className="mode-button"
              aria-label={
                !isDarkTheme(theme) ? "다크 모드로 전환" : "라이트 모드로 전환"
              }
              onClick={() =>
                changeTheme(
                  !isDarkTheme(theme) ? lastDarkTheme.current : "light",
                )
              }
            >
              <Icon name={!isDarkTheme(theme) ? "moon" : "sun"} />
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
              {(["light", "dark"] as const).map((mode) => (
                <optgroup
                  key={mode}
                  label={mode === "light" ? "라이트 테마" : "다크 테마"}
                >
                  {themes
                    .filter((item) => item.mode === mode)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                </optgroup>
              ))}
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
            aria-label={status === "running" ? "실행 중" : "코드 실행"}
            title={status === "running" ? "실행 중" : "코드 실행"}
            onClick={handleRun}
            disabled={!loaded || status === "running"}
          >
            <Icon
              name={status === "running" ? "spinner" : "play"}
              className={status === "running" ? "is-spinning" : undefined}
            />
          </button>
        </div>
      </header>

      <main aria-label="코딩 작업 공간">
        <div
          ref={workspace}
          className={`workspace-grid logs-${logMode}${dragging ? " is-resizing" : ""}`}
          style={
            {
              "--editor-share": `${(1 - logShare) * 100}%`,
              "--log-share": `${logShare * 100}%`,
            } as CSSProperties
          }
        >
          <section
            id="code-panel"
            className="editor-panel"
            aria-label="코드 편집 영역"
          >
            <div className="editor-content">
              {loaded ? (
                <CodeEditor
                  key={language}
                  language={language}
                  theme={theme}
                  fontSize={fontSize}
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
                    ? "이 브라우저에 자동 저장"
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

          {logMode === "split" && (
            <div
              className="split-handle"
              role="separator"
              aria-orientation={stacked ? "horizontal" : "vertical"}
              tabIndex={0}
              aria-label="코드와 로그 영역 크기 조절"
              aria-controls="code-panel log-content"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(logShare * 100)}
              aria-valuetext={`로그 ${Math.round(logShare * 100)}%`}
              onPointerDown={startResize}
              onPointerMove={moveResize}
              onPointerUp={(event) => stopResize(event)}
              onPointerCancel={(event) => stopResize(event, true)}
              onLostPointerCapture={() => {
                if (drag.current) {
                  setLogShare(drag.current.initial);
                  drag.current = null;
                  setDragging(false);
                }
              }}
              onKeyDown={(event) => {
                if (!workspace.current) return;
                const vertical =
                  getComputedStyle(workspace.current).display === "flex";
                const increase = vertical ? "ArrowUp" : "ArrowLeft";
                const decrease = vertical ? "ArrowDown" : "ArrowRight";
                if (![increase, decrease, "Home", "End"].includes(event.key))
                  return;
                event.preventDefault();
                const bounds = workspace.current.getBoundingClientRect();
                const share =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 1
                      : Math.max(
                          0,
                          Math.min(
                            1,
                            logShare + (event.key === increase ? 0.02 : -0.02),
                          ),
                        );
                finishResize(share, vertical ? bounds.height : bounds.width);
              }}
            />
          )}

          <section
            className={`logs-panel ${expanded ? "is-expanded" : "is-collapsed"}`}
            aria-label="실행 로그 영역"
          >
            {expanded ? (
              <div className="panel-header logs-header">
                <h2>
                  <Icon name="terminal" /> 실행 로그{" "}
                  <span className="log-count">{entries.length}</span>
                </h2>
                <div className="log-actions">
                  <button
                    className="clear-button"
                    onClick={() => {
                      setEntries([]);
                      setStatus("ready");
                      setMetrics(null);
                    }}
                    disabled={!entries.length || status === "running"}
                    aria-label="실행 로그 지우기"
                  >
                    지우기
                  </button>
                  <div
                    className="log-modes"
                    role="group"
                    aria-label="로그 보기 방식"
                  >
                    {(
                      [
                        ["full", "전체화면"],
                        ["split", "반반"],
                        ["hidden", "숨김"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={logMode === mode}
                        aria-controls="log-content"
                        onClick={() => selectLogMode(mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="log-rail"
                type="button"
                aria-label="실행 로그 펼치기"
                title="실행 로그 펼치기"
                aria-expanded={false}
                aria-controls="log-content"
                onClick={() => selectLogMode("split")}
              >
                <span className="log-rail-icon">
                  <Icon name="terminal" />
                </span>
              </button>
            )}
            <div id="log-content" className="log-content" hidden={!expanded}>
              <div
                className="log-body"
                ref={logBody}
                role="log"
                aria-label="코드 실행 기록"
                aria-live="polite"
                aria-relevant="additions"
              >
                {entries.map((entry) => (
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
                ))}
              </div>
            </div>
          </section>
        </div>
        <footer className="workspace-footer">
          <span className={`footer-status ${status}`} role="status">
            {statusLabels[status]}
          </span>
          <div className="execution-metrics">
            <span>
              실행 시간{" "}
              <strong>
                {metrics ? `${(metrics.durationMs / 1000).toFixed(3)} s` : "—"}
              </strong>
            </span>
            <span>
              출력{" "}
              <strong>
                {metrics
                  ? `${(metrics.outputBytes / 1024).toFixed(2)} KB`
                  : "—"}
              </strong>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
