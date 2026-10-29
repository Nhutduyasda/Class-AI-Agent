import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, rename, unlink, realpath, open } from "node:fs/promises";
import { resolve, dirname, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Journal, Policy, project, digest, appendEvent, must, type JournalType, type PayloadType } from "./model.ts";

// Git for Windows accepts NUL, but rejects Node's Win32 device namespace path.
export const gitNullDevice = (platform: NodeJS.Platform = process.platform) =>
  platform === "win32" ? "NUL" : "/dev/null";

const Anchor = z.strictObject({
  schemaVersion: z.literal(1),
  commit: z.string().regex(/^[a-f0-9]{40}$/),
  revision: z.number().int().nonnegative(),
  headHash: z.string().regex(/^[a-f0-9]{64}$/),
  policySha256: z.string().regex(/^[a-f0-9]{64}$/)
});

export type Snapshot = {
  commit: string;
  journal: JournalType;
  revision: number;
  headHash: string;
};

export class GitLedger {
  readonly remote: string;
  readonly gitExecutable: string;
  readonly work: string;
  readonly ref: string;
  readonly checkpoint: string;
  readonly policySha256: string;

  constructor(
    options: {
      remote: string;
      gitExecutable?: string;
      work: string;
      ref: string;
      checkpoint: string;
      policySha256: string;
    }
  ) {
    must(/^refs\/heads\/test-[a-z0-9-]+$/.test(options.ref), "ONLY_ISOLATED_TEST_REF_ALLOWED");

    must(
      !/^[a-z][a-z0-9+.-]*:\/\/|[\r\n\x00]/i.test(options.remote) && !options.remote.startsWith("git@") && !options.remote.startsWith("\\\\"),
      "HOSTED_TRANSPORT_DISABLED"
    );

    must(!options.gitExecutable || (isAbsolute(options.gitExecutable) && !/[\r\n\x00]/.test(options.gitExecutable)), "INVALID_GIT_EXECUTABLE");
    this.gitExecutable = options.gitExecutable ?? "git";
    this.remote = resolve(options.remote);
    this.work = resolve(options.work);
    this.ref = options.ref;
    this.checkpoint = resolve(options.checkpoint);
    this.policySha256 = options.policySha256;
  }

  private git(args: string[], input?: string) {
    try {
      const nullDevice = gitNullDevice();
      return execFileSync(this.gitExecutable, ["-c", `core.hooksPath=${nullDevice}`, ...args], {
        cwd: this.work,
        input,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 16 * 1024 * 1024,

        env: {
          PATH: process.env.PATH ?? "",

          ...(process.env.SystemRoot ? {
            SystemRoot: process.env.SystemRoot
          } : {}),

          GIT_TERMINAL_PROMPT: "0",
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: nullDevice,
          GIT_ALLOW_PROTOCOL: "file",
          GIT_AUTHOR_NAME: "Offline Ledger",
          GIT_AUTHOR_EMAIL: "offline-ledger@example.invalid",
          GIT_COMMITTER_NAME: "Offline Ledger",
          GIT_COMMITTER_EMAIL: "offline-ledger@example.invalid"
        }
      }).trim();
    } catch {
      throw Error("GIT_OPERATION_FAILED");
    }
  }

  private async setup() {
    await mkdir(this.work, {
      recursive: true
    });

    this.git(["init", "--quiet"]);

    must(
      this.git(["--git-dir", this.remote, "rev-parse", "--is-bare-repository"]) === "true",
      "LOCAL_BARE_REMOTE_REQUIRED"
    );

    await realpath(this.remote);
  }

  private remoteHead() {
    const line = this.git(["ls-remote", this.remote, this.ref]);
    return line ? line.split(/\s/)[0] : null;
  }

  private async checkpointData() {
    try {
      return Anchor.parse(JSON.parse(await readFile(this.checkpoint, "utf8")));
    } catch {
      throw Error("TRUSTED_CHECKPOINT_REQUIRED");
    }
  }

  private async saveAnchor(s: Snapshot) {
    await mkdir(dirname(this.checkpoint), {
      recursive: true
    });

    const lock = await open(this.checkpoint + ".lock", "wx");

    try {
      let prior: z.infer<typeof Anchor> | undefined;

      try {
        prior = Anchor.parse(JSON.parse(await readFile(this.checkpoint, "utf8")));
      } catch (e: any) {
        if (e.code !== "ENOENT")
          throw Error("TRUSTED_CHECKPOINT_REQUIRED");
      }

      if (prior) {
        must(prior.revision <= s.revision, "CHECKPOINT_AHEAD");
        must(prior.revision !== s.revision || prior.commit === s.commit, "UNEXPECTED_GIT_HISTORY");
      }

      const value = {
        schemaVersion: 1 as const,
        commit: s.commit,
        revision: s.revision,
        headHash: s.headHash,
        policySha256: this.policySha256
      };

      await mkdir(dirname(this.checkpoint), {
        recursive: true
      });

      const tmp = this.checkpoint + ".pending-" + randomUUID();

      try {
        const h = await import("node:fs/promises").then(fs => fs.open(tmp, "wx"));

        try {
          await h.writeFile(JSON.stringify(value) + "\n");
          await h.sync();
        } finally {
          await h.close();
        }

        await rename(tmp, this.checkpoint);
      } finally {
        await unlink(tmp).catch((e: any) => {
          if (e.code !== "ENOENT")
            throw Error("CHECKPOINT_WRITE_FAILED");
        });
      }

      must(digest(await this.checkpointData()) === digest(value), "CHECKPOINT_READBACK_FAILED");
    } finally {
      await lock.close();
      await unlink(this.checkpoint + ".lock");
    }
  }

  private async fetchSnapshot(): Promise<Snapshot> {
    await this.setup();
    const head = this.remoteHead();
    must(head, "JOURNAL_MISSING");
    this.git(["fetch", "--quiet", "--no-tags", this.remote, this.ref]);
    const commit = this.git(["rev-parse", "FETCH_HEAD"]);
    must(commit === head, "REMOTE_CHANGED_DURING_READ");
    let journal: JournalType;

    try {
      journal = Journal.parse(JSON.parse(this.git(["show", `${commit}:ledger.json`])));
      project(journal);
    } catch {
      throw Error("JOURNAL_CORRUPT");
    }

    must(digest(journal.policy) === this.policySha256, "POLICY_PIN_MISMATCH");

    return {
      commit,
      journal,
      revision: journal.events.length,
      headHash: journal.events.at(-1)?.hash ?? digest(journal.policy)
    };
  }

  async read(): Promise<Snapshot> {
    const s = await this.fetchSnapshot(), anchor = await this.checkpointData();
    must(anchor.policySha256 === this.policySha256 && s.revision >= anchor.revision, "JOURNAL_REWOUND");

    try {
      this.git(["merge-base", "--is-ancestor", anchor.commit, s.commit]);
    } catch {
      throw Error("JOURNAL_REWOUND");
    }

    must(
      (anchor.revision ? s.journal.events[anchor.revision - 1]?.hash : digest(s.journal.policy)) === anchor.headHash,
      "JOURNAL_PREFIX_CHANGED"
    );

    await this.saveAnchor(s);
    return s;
  }

  private commit(journal: JournalType, parent?: string) {
    const blob = this.git(["hash-object", "-w", "--stdin"], JSON.stringify(journal) + "\n");
    const tree = this.git(["mktree"], `100644 blob ${blob}\tledger.json\n`);

    return this.git(
      ["commit-tree", tree, ...(parent ? ["-p", parent] : [])],
      `Offline ledger revision ${journal.events.length}\n`
    );
  }

  async initialize(policyInput: unknown) {
    await this.setup();
    const policy = Policy.parse(policyInput);
    must(digest(policy) === this.policySha256, "POLICY_PIN_MISMATCH");
    must(!this.remoteHead(), "JOURNAL_ALREADY_EXISTS");

    try {
      await readFile(this.checkpoint);
      throw Error("CHECKPOINT_ALREADY_EXISTS");
    } catch (e: any) {
      if (e.code !== "ENOENT")
        throw e;
    }

    const journal = Journal.parse({
      schemaVersion: 1,
      policy,
      events: []
    });

    project(journal);
    const commit = this.commit(journal);
    this.git(["push", "--porcelain", this.remote, `${commit}:${this.ref}`]);
    const actual = await this.fetchSnapshot();
    must(actual.commit === commit, "INITIALIZATION_READBACK_UNCERTAIN");
    await this.saveAnchor(actual);
    return actual;
  }

  async append(expectedRevision: number, payload: PayloadType, at: string, eventId = digest(randomUUID())) {
    const before = await this.read();
    must(before.revision === expectedRevision, "REVISION_CONFLICT");
    const journal = appendEvent(before.journal, payload, at, eventId);
    const commit = this.commit(journal, before.commit);

    try {
      this.git(["push", "--porcelain", this.remote, `${commit}:${this.ref}`]);
    } catch {
      throw Error("CAS_CONFLICT_OR_STORAGE_FAILURE");
    }

    let actual: Snapshot;

    try {
      actual = await this.read();
    } catch {
      throw Error("COMMIT_ACK_UNCERTAIN");
    } // no dispatch without readback

    // A competing writer may append after our accepted commit. Verify our exact prefix, never require ref equality.
    must(
      actual.revision >= journal.events.length && actual.journal.events[journal.events.length - 1]?.hash === journal.events.at(-1)!.hash,
      "COMMIT_ACK_UNCERTAIN"
    );

    try {
      this.git(["merge-base", "--is-ancestor", commit, actual.commit]);
    } catch {
      throw Error("COMMIT_ACK_UNCERTAIN");
    }

    await this.saveAnchor(actual);

    return {
      snapshot: actual,

      ack: {
        commit,
        revision: journal.events.length,
        eventHash: journal.events.at(-1)!.hash
      }
    };
  }
}
