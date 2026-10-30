import { Sandbox } from "@vercel/sandbox";
import { csharpDependencies, csharpSetup } from "./csharp-setup";
import type { RunRequest, RunResponse } from "./run-code";

// This supervisor runs INSIDE the microVM, never in the Next.js process.
// It bounds output before it reaches SDK logs and terminates the whole process group.
const supervisor = String.raw`
import json, os, selectors, signal, subprocess, sys, time
command = (["python3", "-I", "-u", "/vercel/sandbox/solution.py"] if sys.argv[1] == "python" else
    ["/vercel/sandbox/.dotnet/dotnet", "run", "--no-restore", "--project", "/vercel/sandbox/runner", "--verbosity", "quiet"])
started = time.monotonic()
p = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    start_new_session=True, cwd="/vercel/sandbox")
selector = selectors.DefaultSelector()
selector.register(p.stdout, selectors.EVENT_READ, "stdout")
selector.register(p.stderr, selectors.EVENT_READ, "stderr")
output = {"stdout": bytearray(), "stderr": bytearray()}
limit, total, reason = 65536, 0, None
deadline = time.monotonic() + 20
try:
    while selector.get_map():
        if time.monotonic() >= deadline:
            reason = "timeout"
            break
        for key, _ in selector.select(0.1):
            chunk = os.read(key.fileobj.fileno(), 4096)
            if not chunk:
                selector.unregister(key.fileobj)
                continue
            remaining = limit - total
            output[key.data].extend(chunk[:remaining])
            total += min(len(chunk), remaining)
            if len(chunk) > remaining:
                reason = "output_limit"
                break
        if reason:
            break
finally:
    try:
        os.killpg(p.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    p.wait()
    selector.close()
result = {"mode": "execution", "status": "completed" if p.returncode == 0 and not reason else "error",
    "stdout": output["stdout"].decode("utf-8", "replace"), "stderr": output["stderr"].decode("utf-8", "replace"),
    "exitCode": p.returncode, "durationMs": round((time.monotonic() - started) * 1000), "outputBytes": total}
if reason:
    result["reason"] = reason
    result["stderr"] += "\n" + ("실행 시간 제한(20초)을 초과했습니다." if reason == "timeout" else "출력 제한(64KB)을 초과했습니다.")
print(json.dumps(result))
`;

export async function executeCode(request: RunRequest): Promise<RunResponse> {
  const snapshotId = process.env.CSHARP_SANDBOX_SNAPSHOT_ID;
  const options = {
    persistent: false,
    timeout: 60_000,
    resources: { vcpus: 1 },
    networkPolicy: "deny-all" as const,
    env: {
      DOTNET_CLI_TELEMETRY_OPTOUT: "1",
      DOTNET_NOLOGO: "1",
      DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1",
      DOTNET_CLI_HOME: "/vercel/sandbox",
    },
  };
  let sandbox: Sandbox;
  if (request.language === "csharp") {
    try {
      if (!snapshotId) throw new Error("No C# snapshot configured");
      sandbox = await Sandbox.create({
        ...options,
        source: { type: "snapshot", snapshotId },
      });
    } catch {
      // An expired/deleted optimization snapshot must not disable C# execution.
      sandbox = await Sandbox.create({
        ...options,
        timeout: 90_000,
        networkPolicy: "allow-all",
      });
      try {
        const dependencies = await sandbox.runCommand({
          cmd: "bash",
          args: ["-lc", csharpDependencies],
          sudo: true,
          timeoutMs: 35_000,
        });
        if (dependencies.exitCode !== 0)
          throw new Error("C# dependencies unavailable");
        const setup = await sandbox.runCommand({
          cmd: "bash",
          args: ["-lc", csharpSetup],
          timeoutMs: 35_000,
        });
        if (setup.exitCode !== 0) throw new Error("C# SDK unavailable");
        await sandbox.updateNetworkPolicy("deny-all");
      } catch (error) {
        await sandbox.stop().catch(() => {});
        throw error;
      }
    }
  } else {
    sandbox = await Sandbox.create(options);
  }
  try {
    await sandbox.writeFiles([
      {
        path: "/vercel/sandbox/supervisor.py",
        content: Buffer.from(supervisor),
      },
      {
        path:
          request.language === "python"
            ? "/vercel/sandbox/solution.py"
            : "/vercel/sandbox/runner/Program.cs",
        content: Buffer.from(request.code),
      },
    ]);
    const result = await sandbox.runCommand({
      cmd: "python3",
      args: ["-I", "/vercel/sandbox/supervisor.py", request.language],
      cwd: "/vercel/sandbox",
      timeoutMs: 30_000,
    });
    if (result.exitCode !== 0) throw new Error("Sandbox supervisor failed");
    return JSON.parse(await result.stdout()) as RunResponse;
  } finally {
    // Hard session timeout remains a backstop if cleanup itself fails.
    await sandbox.stop().catch(() => console.error("Sandbox cleanup failed"));
  }
}
