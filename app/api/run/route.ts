import { NextRequest, NextResponse } from "next/server";
import { executeCode } from "@/lib/sandbox-runner";
import type { RunResponse } from "@/lib/run-code";

export const runtime = "nodejs";
export const maxDuration = 120;
const MAX_BODY_BYTES = 100_000;
const MAX_CODE_BYTES = 65_536;
// Per warm instance; Vercel Firewall can enforce distributed limits as usage grows.
const requests = new Map<string, { count: number; reset: number }>();
let active = 0;

function failure(
  message: string,
  status: number,
  reason: RunResponse["reason"] = "service",
) {
  return NextResponse.json(
    {
      mode: "execution",
      status: "error",
      stdout: "",
      stderr: message,
      exitCode: null,
      reason,
    } satisfies RunResponse,
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== request.nextUrl.origin
  ) {
    return failure("같은 출처의 요청만 허용합니다.", 403, "invalid_request");
  }
  const now = Date.now();
  for (const [key, value] of requests)
    if (value.reset <= now) requests.delete(key);
  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "local";
  const rate = requests.get(ip) ?? { count: 0, reset: now + 60_000 };
  if (rate.count >= 5 || active >= 2 || requests.size >= 5000)
    return failure("요청이 많습니다. 잠시 후 다시 실행해 주세요.", 429);
  rate.count++;
  requests.set(ip, rate);

  let body: unknown;
  try {
    if (!request.headers.get("content-type")?.includes("application/json"))
      return failure("JSON 요청이 필요합니다.", 415, "invalid_request");
    const reader = request.body?.getReader();
    if (!reader)
      return failure("실행할 코드를 입력해 주세요.", 400, "invalid_request");
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return failure("요청 크기를 초과했습니다.", 413, "invalid_request");
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return failure("요청 형식이 올바르지 않습니다.", 400, "invalid_request");
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("language" in body) ||
    !("code" in body) ||
    (body.language !== "python" && body.language !== "csharp") ||
    typeof body.code !== "string" ||
    !body.code.trim() ||
    Buffer.byteLength(body.code) > MAX_CODE_BYTES
  ) {
    return failure(
      "Python 또는 C# 코드(최대 64KB)를 입력해 주세요.",
      400,
      "invalid_request",
    );
  }
  active++;
  try {
    const result = await executeCode({
      language: body.language,
      code: body.code,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("Sandbox execution unavailable");
    return failure(
      "실행 환경을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      503,
    );
  } finally {
    active--;
  }
}
