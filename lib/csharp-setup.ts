// Trusted bootstrap only. No submitted source is present until network is denied.
export const csharpDependencies =
  "if command -v apt-get >/dev/null; then apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y libicu-dev; else dnf install -y libicu; fi";
export const csharpSetup =
  "mkdir -p /vercel/sandbox && curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh && bash /tmp/dotnet-install.sh --version 8.0.427 --install-dir /vercel/sandbox/.dotnet && /vercel/sandbox/.dotnet/dotnet new console --framework net8.0 --no-restore -o /vercel/sandbox/runner && /vercel/sandbox/.dotnet/dotnet restore /vercel/sandbox/runner --ignore-failed-sources";
