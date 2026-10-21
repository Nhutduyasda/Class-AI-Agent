// Credential-free fake-only setup. NEVER creates owner approval or production authority.
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { execFileSync } from "node:child_process";
import { captureBuild, sha, safeEnv, git } from "./trust.ts";
import { privateRoots } from "./retention.ts";
const [rootArg, mediaArg, backupArg, anchorArg, workArg, gitArg, ffArg] =
  process.argv.slice(2);
if (!ffArg)
  throw Error(
    "Usage: node setup.ts <project-root> <private-media> <private-backup> <checkpoint-dir> <mock-work> <absolute-git> <absolute-ffmpeg>",
  );
const root = resolve(rootArg),
  media = resolve(mediaArg),
  backup = resolve(backupArg),
  anchor = resolve(anchorArg),
  work = resolve(workArg);
const repoRoot = git(root, resolve(gitArg), ["rev-parse", "--show-toplevel"]);
for (const path of [media, backup, anchor, work]) {
  const rel = relative(repoRoot, path);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel)))
    throw Error("OUTSIDE_REPO_REQUIRED");
  await mkdir(path, { recursive: true, mode: 0o700 });
}
if ((await readdir(work)).length) throw Error('MOCK_WORK_ALREADY_EXISTS');
await privateRoots(repoRoot, media, backup, anchor);
const tools = { git: resolve(gitArg), ffmpeg: resolve(ffArg) },
  b = await captureBuild(root, tools),
  r = JSON.parse(
    await readFile(
      join(root, "briefs/auto-factory/video06-v2-readiness.json"),
      "utf8",
    ),
  );
const now = new Date().toISOString(),
  expires = new Date(Date.now() + 3600000).toISOString();
const a = {
  schemaVersion: 1,
  scope: "MOCK_ONLY_NOT_OWNER_APPROVAL",
  productionId: "video06-v2-audition",
  buildSha256: sha(JSON.stringify(b)),
  scriptSha256: sha(
    await readFile(join(root, "briefs/english-video-06-candidate-v2.json")),
  ),
  readinessSha256: sha(
    await readFile(join(root, "briefs/auto-factory/video06-v2-readiness.json")),
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
  checkedAt: now,
  pricingExpiresAt: expires,
  expiresAt: expires,
  paidExecutionAllowed: false,
};
const remote = join(work, "mock.git"),
  writer = join(work, "writer"),
  buildFile = join(work, "mock-build.json"),
  authorizationFile = join(work, "mock-authorization.json");
await mkdir(writer, { recursive: true });
execFileSync(tools.git, ["init", "--bare", "--quiet", remote], {
  env: safeEnv(),
  stdio: "pipe",
});
await writeFile(buildFile, JSON.stringify(b), { flag: "wx", mode: 0o600 });
await writeFile(authorizationFile, JSON.stringify(a), {
  flag: "wx",
  mode: 0o600,
});
const config = join(work, "mock-config.json");
await writeFile(
  config,
  JSON.stringify({
    root,
    tools,
    media,
    backup,
    anchor,
    remote,
    work: writer,
    buildFile,
    authorizationFile,
  }),
  { flag: "wx", mode: 0o600 },
);
console.log(config);
