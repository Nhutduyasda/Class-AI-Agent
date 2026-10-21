// Fake-only test setup. Does not approve any real script or create production authority.
import {
  mkdtemp,
  mkdir,
  copyFile,
  cp,
  writeFile,
  readFile,
} from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  sources,
  captureBuild,
  sha,
  loadedProject,
  safeEnv,
  type ToolPaths,
} from "./trust.ts";
export const NOW = "2026-10-21T10:00:00Z";
export function tools(): ToolPaths {
  const find = (name: string) =>
    process.platform === "win32"
      ? execFileSync("where.exe", [name], { encoding: "utf8" })
          .split(/\r?\n/)
          .find(Boolean)!
      : execFileSync("which", [name], { encoding: "utf8" }).trim();
  return { git: find("git"), ffmpeg: find("ffmpeg") };
}
export async function fixture() {
  const home = await mkdtemp(join(tmpdir(), "Video06-Đ-")),
    root = join(home, "isolated-code");
  await mkdir(root);
  for (const path of sources) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await copyFile(join(loadedProject, path), join(root, path));
  }
  await writeFile(join(root, ".gitignore"), "node_modules/\n");
  await mkdir(join(root, "node_modules"));
  await cp(
    resolve(loadedProject, "node_modules/zod"),
    join(root, "node_modules/zod"),
    { recursive: true, dereference: true },
  );
  const t = tools(),
    g = (args: string[]) =>
      execFileSync(t.git, ["-C", root, ...args], {
        env: {
          ...safeEnv(),
          GIT_AUTHOR_NAME: "Mock",
          GIT_AUTHOR_EMAIL: "mock@example.invalid",
          GIT_COMMITTER_NAME: "Mock",
          GIT_COMMITTER_EMAIL: "mock@example.invalid",
        },
        stdio: "pipe",
      });
  g(["init", "--quiet"]);
  g(["add", "."]);
  g(["commit", "-qm", "Isolated fake-only executor test source"]);
  const dirs = [
    "media",
    "backup",
    "independent-directory-anchor",
    "remote.git",
    "writer",
    "external-approval",
  ];
  for (const p of dirs) await mkdir(join(home, p));
  execFileSync(t.git, ["init", "--bare", "--quiet", join(home, "remote.git")], {
    env: safeEnv(),
    stdio: "pipe",
  });
  const b = await captureBuild(root, t),
    r = JSON.parse(
      await readFile(
        join(root, "briefs/auto-factory/video06-v2-readiness.json"),
        "utf8",
      ),
    );
  const a = {
    schemaVersion: 1,
    scope: "MOCK_ONLY_NOT_OWNER_APPROVAL",
    productionId: "video06-v2-audition",
    buildSha256: sha(JSON.stringify(b)),
    scriptSha256: sha(
      await readFile(join(root, "briefs/english-video-06-candidate-v2.json")),
    ),
    readinessSha256: sha(
      await readFile(
        join(root, "briefs/auto-factory/video06-v2-readiness.json"),
      ),
    ),
    ssmlSha256: r.audition.variants.flatMap((v: any) =>
      v.requests.map((x: any) => x.ssmlSha256),
    ),
    maxRequests: 12,
    maxAttempts: 1,
    azureMaxMicrousd: 30000,
    totalMaxMicrousd: 80000,
    openingLiabilities: 12345,
    mockOpeningBalanceVerified: true,
    checkedAt: "2026-10-21T00:00:00Z",
    pricingExpiresAt: "2026-10-22T00:00:00Z",
    expiresAt: "2026-10-22T00:00:00Z",
    paidExecutionAllowed: false,
  };
  const buildFile = join(home, "external-approval", "mock-build.json"),
    authorizationFile = join(
      home,
      "external-approval",
      "mock-authorization.json",
    );
  await writeFile(buildFile, JSON.stringify(b));
  await writeFile(authorizationFile, JSON.stringify(a));
  return {
    home,
    b,
    a,
    c: {
      root,
      tools: t,
      buildFile,
      authorizationFile,
      media: join(home, "media"),
      backup: join(home, "backup"),
      anchor: join(home, "independent-directory-anchor"),
      remote: join(home, "remote.git"),
      work: join(home, "writer"),
    },
  };
}
