import {
  mkdir,
  realpath,
  lstat,
  readFile,
  writeFile,
  open,
} from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { z } from "zod";
import { sha } from "./trust.ts";
export const sections = [
  "authorized-wav",
  "ssml",
  "receipts",
  "imports",
  "captions",
  "mp4",
  "qa",
  "owner-reviews",
  "ledger-evidence",
] as const;
function inside(a: string, b: string) {
  const r = relative(a, b);
  return r === "" || (!r.startsWith("..") && !isAbsolute(r));
}
export async function privateRoots(
  repo: string,
  media: string,
  backup: string,
  anchor: string,
) {
  const roots = await Promise.all(
    [repo, media, backup, anchor].map((p) => realpath(p)),
  );
  for (let i = 1; i < roots.length; i++) {
    if (inside(roots[0], roots[i]) || inside(roots[i], roots[0]))
      throw Error("PRIVATE_ROOT_IN_REPO");
    for (let j = 1; j < i; j++)
      if (inside(roots[j], roots[i]) || inside(roots[i], roots[j]))
        throw Error("PRIVATE_ROOT_OVERLAP");
    if (!(await lstat(roots[i])).isDirectory())
      throw Error("PRIVATE_ROOT_DIRECTORY");
  }
  return {
    media: roots[1],
    backup: roots[2],
    anchor: roots[3],
    storageIndependence: "DIRECTORY_SEPARATION_ONLY_UNVERIFIED",
    acl: "UNVERIFIED",
  };
}
export async function layout(root: string) {
  for (const s of sections)
    await mkdir(join(root, s), { recursive: true, mode: 0o700 });
}
function safe(p: string) {
  if (
    !/^[a-zA-Z0-9_./-]+$/.test(p) ||
    p.split("/").some((x) => x === ".." || !x) ||
    !sections.some((s) => p.startsWith(s + "/"))
  )
    throw Error("RETENTION_PATH");
}
async function file(root: string, p: string) {
  safe(p);
  const target = join(root, p);
  if (
    !inside(await realpath(root), await realpath(target)) ||
    !(await lstat(target)).isFile() ||
    (await lstat(target)).isSymbolicLink()
  )
    throw Error("RETENTION_PATH");
  return target;
}
export async function exclusive(
  root: string,
  path: string,
  bytes: Buffer | string,
) {
  safe(path);
  const target = resolve(root, path);
  if (!inside(await realpath(root), target)) throw Error("RETENTION_PATH");
  await mkdir(resolve(target, ".."), { recursive: true, mode: 0o700 });
  if (!inside(await realpath(root), await realpath(resolve(target, ".."))))
    throw Error("RETENTION_PATH");
  try {
    const f = await open(target, "wx", 0o600);
    try {
      await f.writeFile(bytes);
      await f.sync();
    } finally {
      await f.close();
    }
  } catch (e: any) {
    if (
      e.code !== "EEXIST" ||
      !Buffer.from(bytes).equals(await readFile(await file(root, path)))
    )
      throw Error("IMMUTABLE_MEDIA_CONFLICT");
  }
  if (!Buffer.from(bytes).equals(await readFile(await file(root, path))))
    throw Error("MEDIA_READBACK_FAILED");
}
const Snapshot = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("PRIVATE_MOCK_BACKUP"),
  files: z
    .array(
      z.strictObject({
        path: z.string(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .min(1)
    .max(100),
});
export async function backupFiles(
  media: string,
  backup: string,
  paths: string[],
) {
  if (
    inside(await realpath(media), await realpath(backup)) ||
    inside(await realpath(backup), await realpath(media))
  )
    throw Error("BACKUP_OVERLAP");
  if (new Set(paths).size !== paths.length)
    throw Error("DUPLICATE_BACKUP_PATH");
  const files = [];
  for (const path of paths) {
    const bytes = await readFile(await file(media, path));
    await exclusive(backup, path, bytes);
    files.push({ path, sha256: sha(bytes) });
  }
  const m = Snapshot.parse({
    schemaVersion: 1,
    kind: "PRIVATE_MOCK_BACKUP",
    files,
  });
  await exclusive(
    backup,
    "ledger-evidence/backup-manifest.json",
    JSON.stringify(m) + "\n",
  );
  return m;
}
export async function restore(
  backup: string,
  target: string,
  expectedManifestSha256: string,
) {
  if (
    inside(await realpath(backup), await realpath(target)) ||
    inside(await realpath(target), await realpath(backup))
  )
    throw Error("RESTORE_OVERLAP");
  const raw = await readFile(
    await file(backup, "ledger-evidence/backup-manifest.json"),
  );
  if (sha(raw) !== expectedManifestSha256)
    throw Error("BACKUP_MANIFEST_AUTHORITY");
  const m = Snapshot.parse(JSON.parse(raw.toString()));
  const all = [];
  for (const x of m.files) {
    const b = await readFile(await file(backup, x.path));
    if (sha(b) !== x.sha256) throw Error("BACKUP_HASH_MISMATCH");
    all.push({ x, b });
  }
  for (const { x, b } of all) {
    await exclusive(target, x.path, b);
    if (sha(await readFile(await file(target, x.path))) !== x.sha256)
      throw Error("RESTORE_HASH_MISMATCH");
  }
  return {
    files: m.files.length,
    status: "HASH_VERIFIED_RESTORE",
    productionRetention: "UNVERIFIED",
  };
}
