import type { Language } from "./languages";

/** Future POST /api/run request body. */
export interface RunRequest {
  language: Language;
  code: string;
}

/** Preview completion is distinct from actual code execution. */
export type RunResponse =
  | { mode: "preview"; status: "completed"; message: string }
  | {
      mode: "execution";
      status: "completed" | "error";
      stdout: string;
      stderr: string;
      exitCode: number | null;
    };

/** UI-only adapter: no network, compilation, or evaluation of the supplied code. */
export async function runCode(_request: RunRequest): Promise<RunResponse> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return {
    mode: "preview",
    status: "completed",
    message: "실행 서버 미연결 — UI 미리보기",
  };
}
