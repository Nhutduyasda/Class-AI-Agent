import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const project = resolve(import.meta.dirname, "../..");
const browser =
  process.env.BROWSER_EXECUTABLE ||
  resolve(
    project,
    "node_modules/.remotion/chrome-headless-shell",
    process.platform === "win32"
      ? "win64/chrome-headless-shell-win64/chrome-headless-shell.exe"
      : "linux64/chrome-headless-shell-linux64/chrome-headless-shell",
  );
if (!existsSync(browser))
  throw Error("BROWSER_NOT_INSTALLED_USE_GATE_1B_SETUP");
const children = [];
function start(binary, args) {
  const p = spawn(binary, args, {
    cwd: resolve(import.meta.dirname, ".."),
    stdio: binary === process.execPath ? "inherit" : "ignore",
    shell: process.platform === "win32",
  });
  children.push(p);
  return p;
}
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error("LOCAL_TEST_SERVER_UNAVAILABLE");
}
let code = 1;
try {
  start("npm", ["run", "api"]);
  start("npm", ["run", "dev"]);
  start(browser, [
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9223",
    `--user-data-dir=${resolve(project, "out/gate3a-browser-profile")}`,
    "about:blank",
  ]);
  await Promise.all([
    ready("http://127.0.0.1:4174/api/overview"),
    ready("http://127.0.0.1:5173/"),
    ready("http://127.0.0.1:9223/json"),
  ]);
  const test = start(process.execPath, ["tests/browser-check.mjs"]);
  code = await new Promise((resolve) => test.on("close", resolve));
} finally {
  for (const p of children) p.kill();
}
process.exitCode = code;
