// Run with Vercel OIDC credentials in .env.local (vercel env pull).
import { Sandbox } from "@vercel/sandbox";
const sandbox = await Sandbox.create({
  persistent: false,
  timeout: 240_000,
  resources: { vcpus: 1 },
});
try {
  const dependencies = await sandbox.runCommand({
    cmd: "bash",
    args: [
      "-lc",
      "if command -v apt-get >/dev/null; then apt-get update -qq && apt-get install -y libicu-dev; else dnf install -y libicu; fi",
    ],
    sudo: true,
  });
  if (dependencies.exitCode !== 0) throw new Error("ICU installation failed");
  const setup = await sandbox.runCommand({
    cmd: "bash",
    args: [
      "-lc",
      "mkdir -p /vercel/sandbox && curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh && bash /tmp/dotnet-install.sh --version 8.0.427 --install-dir /vercel/sandbox/.dotnet && /vercel/sandbox/.dotnet/dotnet new console --framework net8.0 --no-restore -o /vercel/sandbox/runner && /vercel/sandbox/.dotnet/dotnet restore /vercel/sandbox/runner --ignore-failed-sources",
    ],
    env: { DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_NOLOGO: "1" },
  });
  if (setup.exitCode !== 0) throw new Error("SDK setup failed");
  const snapshot = await sandbox.snapshot({ expiration: 0 });
  console.log(`CSHARP_SANDBOX_SNAPSHOT_ID=${snapshot.snapshotId}`);
} finally {
  await sandbox.stop().catch(() => {});
}
