import type { Language } from "./languages";

export interface RunRequest {
  language: Language;
  code: string;
}

export interface RunResponse {
  mode: "execution";
  status: "completed" | "error";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  reason?: "timeout" | "output_limit" | "service" | "invalid_request";
}

export async function runCode(request: RunRequest): Promise<RunResponse> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(110_000),
  });
  const result: RunResponse = await response.json();
  if (result.mode !== "execution")
    throw new Error("실행 응답을 읽을 수 없습니다.");
  return result;
}
