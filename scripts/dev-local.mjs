import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", ...process.argv.slice(2)], {
  stdio: "inherit", windowsHide: true, env: { ...process.env, BRICKSSNAP_LOCAL_CODEX: "true", BRICKSSNAP_LOCAL_WORDPRESS: "true" },
});
child.on("exit", code => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
