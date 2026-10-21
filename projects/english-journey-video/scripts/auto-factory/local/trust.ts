import { z } from "zod";
import { readFile, readdir, realpath, lstat } from "node:fs/promises";
import { resolve, relative, isAbsolute, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
export const sha = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
export const loadedProject = resolve(import.meta.dirname, "../../..");
const hex = z.string().regex(/^[a-f0-9]{64}$/);
export const sources = [
  "scripts/auto-factory/local/trust.ts",
  "scripts/auto-factory/local/executor.ts",
  "scripts/auto-factory/local/retention.ts",
  "scripts/auto-factory/local/cli.ts",
  "src/auto-factory/control/model.ts",
  "src/auto-factory/control/git-ledger.ts",
  "src/auto-factory/control/executor.ts",
  "scripts/auto-factory/pilot/readiness.mjs",
  "scripts/auto-factory/pilot/prepare.mjs",
  "scripts/auto-factory/pilot/media.ts",
  "scripts/bilingual/core.mjs",
  "briefs/english-video-06-candidate-v2.json",
  "briefs/auto-factory/video06-v2-readiness.json",
  "briefs/auto-factory/video06-price-reference.json",
  "package.json",
  "package-lock.json",
] as const;
export const Build = z.strictObject({
  schemaVersion: z.literal(1),
  scope: z.literal("MOCK_ONLY"),
  codeSha: z.string().regex(/^[a-f0-9]{40}$/),
  files: z.array(z.strictObject({ path: z.string(), sha256: hex })),
  zodTreeSha256: hex,
  nodeSha256: hex,
  ffmpegSha256: hex,
  gitSha256: hex,
  nodeVersion: z.literal("24.19.0"),
  ffmpegVersion: z.literal("6.1.1"),
  gitVersion: z.literal("2.51.1"),
  paidExecutionAllowed: z.literal(false),
});
export type ToolPaths = { git: string; ffmpeg: string };
export const safeEnv = () => ({
  PATH: process.env.PATH ?? "",
  ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  GIT_TERMINAL_PROMPT: "0",
  GIT_ALLOW_PROTOCOL: "file",
});
export function git(root: string, tool: string, args: string[]) {
  try {
    return execFileSync(
      tool,
      [
        "-c",
        "core.hooksPath=" +
          (process.platform === "win32" ? "NUL" : "/dev/null"),
        "-C",
        root,
        ...args,
      ],
      { encoding: "utf8", env: safeEnv(), stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
  } catch {
    throw Error("CHECKOUT_CHECK_FAILED");
  }
}
export async function external(root: string, path: string) {
  const base = await realpath(root),
    file = await realpath(path),
    rel = relative(base, file);
  if (!rel.startsWith("..") && !isAbsolute(rel))
    throw Error("EXTERNAL_PATH_REQUIRED");
  return file;
}
export async function regular(root: string, rel: string) {
  if (
    !/^[A-Za-z0-9_./-]+$/.test(rel) ||
    rel.split("/").some((x) => x === ".." || !x) ||
    isAbsolute(rel)
  )
    throw Error("UNSAFE_PATH");
  const file = join(root, rel),
    r = await realpath(file);
  if (
    relative(await realpath(root), r).startsWith("..") ||
    (await lstat(file)).isSymbolicLink() ||
    !(await lstat(file)).isFile()
  )
    throw Error("UNSAFE_PATH");
  return r;
}
export async function treeHash(root: string): Promise<string> {
  const rows: string[] = [];
  async function walk(at: string) {
    for (const x of (
      await readdir(join(root, at), { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const rel = at ? at + "/" + x.name : x.name;
      if (x.isSymbolicLink()) throw Error("DEPENDENCY_SYMLINK");
      if (x.isDirectory()) await walk(rel);
      else if (x.isFile())
        rows.push(rel + ":" + sha(await readFile(join(root, rel))));
      else throw Error("DEPENDENCY_FILE_TYPE");
    }
  }
  await walk("");
  return sha(JSON.stringify(rows));
}
export async function captureBuild(root: string, tools: ToolPaths) {
  const files = [];
  for (const path of sources)
    files.push({
      path,
      sha256: sha(await readFile(await regular(root, path))),
    });
  const gitPath = await realpath(tools.git),
    ffmpeg = await realpath(tools.ffmpeg);
  if (process.versions.node !== "24.19.0") throw Error("NODE_VERSION");
  const ff = execFileSync(ffmpeg, ["-version"], {
    encoding: "utf8",
    env: safeEnv(),
  }).split("\n")[0];
  if (!/^ffmpeg version 6\.1\.1(?:[-\s]|$)/.test(ff))
    throw Error("FFMPEG_VERSION");
  if (
    !/^git version 2\.51\.1(?:\.windows\.1)?$/.test(
      execFileSync(gitPath, ["--version"], {
        encoding: "utf8",
        env: safeEnv(),
      }).trim(),
    )
  )
    throw Error("GIT_VERSION");
  const head = git(root, gitPath, ["rev-parse", "HEAD"]);
  if (git(root, gitPath, ["status", "--porcelain", "--untracked-files=all"]))
    throw Error("CHECKOUT_NOT_CLEAN");
  return Build.parse({
    schemaVersion: 1,
    scope: "MOCK_ONLY",
    codeSha: head,
    files,
    zodTreeSha256: await treeHash(resolve(root, "node_modules/zod")),
    nodeSha256: sha(await readFile(process.execPath)),
    ffmpegSha256: sha(await readFile(ffmpeg)),
    gitSha256: sha(await readFile(gitPath)),
    nodeVersion: process.versions.node,
    ffmpegVersion: "6.1.1",
    gitVersion: "2.51.1",
    paidExecutionAllowed: false,
  });
}
export async function verifyBuild(
  root: string,
  raw: unknown,
  tools: ToolPaths,
) {
  const expected = Build.parse(raw),
    actual = await captureBuild(root, tools);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw Error("BUILD_HASH_MISMATCH");
  // Verify that this process's loaded source/dependency bytes match the trusted checkout too.
  for (const x of expected.files)
    if (sha(await readFile(await regular(loadedProject, x.path))) !== x.sha256)
      throw Error("LOADED_CODE_MISMATCH");
  if (
    (await treeHash(resolve(loadedProject, "node_modules/zod"))) !==
    expected.zodTreeSha256
  )
    throw Error("LOADED_DEPENDENCY_MISMATCH");
  return expected;
}
