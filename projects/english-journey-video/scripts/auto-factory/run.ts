import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  plan,
  hash,
  Run,
  transition,
  resume,
  ReviewItem,
  Brief,
  Presenter,
  Product,
  Voice,
  Ledger,
  reserve,
  RenderPlan,
} from "../../src/auto-factory/engine.ts";

import { z } from "zod";
import { fixtures, NOW } from "./fixtures.ts";

export function verifyMp4(file: string, frames: number) {
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], {
    encoding: "utf8"
  }));

  const v = probe.streams.find((s: any) => s.codec_type === "video"), a = probe.streams.find((s: any) => s.codec_type === "audio");

  if (!v || v.width !== 1080 || v.height !== 1920 || v.codec_name !== "h264" || v.r_frame_rate !== "30/1" || Number(v.nb_frames) !== frames || a?.codec_name !== "aac" || Math.abs(Number(probe.format.duration) - frames / 30) > .05)
    throw Error("MP4_INVALID");

  execFileSync("ffmpeg", ["-v", "error", "-xerror", "-i", file, "-f", "null", "-"], {
    stdio: "pipe"
  });

  return {
    format: "PASS",
    fullDecode: "PASS",
    width: v.width,
    height: v.height,
    fps: 30,
    frames,
    videoCodec: v.codec_name,
    audioCodec: a.codec_name,
    duration: Number(probe.format.duration),
    speech: "OMITTED_SILENT_FIXTURE",
    captionTiming: "SCENE_CLOCK_ONLY_NOT_SPEECH_ALIGNMENT",
    humanReview: "PENDING",
    presenterVisual: "GEOMETRIC_PLACEHOLDER_ONLY"
  };
}

async function atomic(path: string, data: unknown) {
  await writeFile(path + ".pending", JSON.stringify(data, null, 2) + "\n");
  await rename(path + ".pending", path);
}

export async function run(root: string) {
  await mkdir(root, {
    recursive: true
  });

  const queue = [];

  for (const input of fixtures.slice(0, 3)) {
    const p = plan(input, NOW), dir = join(root, p.runId);

    await mkdir(dir, {
      recursive: true
    });

    const stateFile = join(dir, "state.json");
    const ledgerFile = join(dir, "simulation-ledger.json");

    let ledger: any = {
      schemaVersion: 1,
      kind: "SIMULATION_ONLY",
      revision: 0,
      openingLiability: 0,
      reservations: []
    };

    try {
      ledger = JSON.parse(await readFile(ledgerFile, "utf8"));
    } catch (e: any) {
      if (e.code !== "ENOENT")
        throw e;
    }

    ledger = reserve(ledger, {
      runId: p.runId,
      localDate: input.localDate,
      inputSha256: hash(p),
      microusd: 0
    }, ledger.revision);

    await atomic(ledgerFile, ledger);

    let state = Run.parse({
      schemaVersion: 1,
      runId: p.runId,
      inputSha256: hash(p),
      state: "PLANNED",
      revision: 0
    });

    try {
      state = resume(JSON.parse(await readFile(stateFile, "utf8")), p);
    } catch (e: any) {
      if (e.code !== "ENOENT")
        throw e;
    }

    const move = async (to: any) => {
      state = transition(state, to, state.revision);
      await atomic(stateFile, state);
    };

    if (state.state === "PLANNED")
      await move("VALIDATED");

    if (state.state === "VALIDATED") {
      await atomic(join(dir, "plan.json"), p);
      await move("RENDER_PLANNED");
    }

    if (state.state !== "RENDER_PLANNED") {
      const saved = JSON.parse(await readFile(join(dir, "plan.json"), "utf8"));

      if (hash(saved) !== hash(p))
        throw Error("PLAN_FILE_INTEGRITY");
    }

    const mp4 = join(dir, "fixture.mp4");

    if (state.state === "RENDER_PLANNED") {
      const filter = [
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='OFFLINE FIXTURE - NO SPEECH':x=90:y=150:fontsize=37:fontcolor=0xffcf65`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${p.mode}':x=90:y=240:fontsize=40:fontcolor=white`,
        `drawbox=x=100:y=510:w=800:h=650:color=0x203851:t=fill`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${input.visibility}':x=150:y=670:fontsize=56:fontcolor=0x65dacb`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Minh - identity placeholder':x=150:y=790:fontsize=36:fontcolor=white`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='No filmed person or product':x=150:y=880:fontsize=34:fontcolor=white`
      ];

      for (const [i, s] of p.shots.entries()) {
        const file = join(dir, `caption-${i}.txt`);
        await writeFile(file, s.spoken);

        filter.push(
          `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='${file}':x=90:y=1300:fontsize=34:fontcolor=white:enable='gte(n,${s.startFrame})*lt(n,${s.endFrame})'`
        );
      }

      execFileSync("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x101d32:s=1080x1920:r=30",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=48000:cl=mono",
        "-vf",
        filter.join(","),
        "-t",
        String(p.durationInFrames / 30),
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "28",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        mp4
      ], {
        stdio: "pipe"
      });

      await move("RENDERED");
    }

    const qa = verifyMp4(mp4, p.durationInFrames);

    const {
      createHash
    } = await import("node:crypto");

    const rawHash = createHash("sha256").update(await readFile(mp4)).digest("hex");

    if (state.state === "RENDERED") {
      await atomic(join(dir, "qa.json"), {
        ...qa,
        sha256: rawHash,
        planSha256: hash(p)
      });

      await move("QA_PASSED");
    } else {
      const old = JSON.parse(await readFile(join(dir, "qa.json"), "utf8"));

      if (old.sha256 !== rawHash || old.planSha256 !== hash(p))
        throw Error("ARTIFACT_INTEGRITY");
    }

    if (state.state === "QA_PASSED")
      await move("PENDING_OWNER_REVIEW");

    queue.push(ReviewItem.parse({
      schemaVersion: 1,
      runId: p.runId,
      planSha256: hash(p),
      videoSha256: rawHash,
      status: "PENDING_OWNER",
      fixture: true,
      publicationAllowed: false
    }));

    for (const [name, sec] of [["hook", 0], ["middle", 12], ["end", 23]] as const) execFileSync(
      "ffmpeg",
      ["-v", "error", "-y", "-ss", String(sec), "-i", mp4, "-frames:v", "1", join(dir, `${name}.png`)],
      {
        stdio: "pipe"
      }
    );
  }

  await atomic(join(root, "review-queue.json"), queue);
  return queue;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve("out/auto-factory");

  if (process.argv.includes("--schemas")) {
    await mkdir("schemas/auto-factory", {
      recursive: true
    });

    for (const [name, schema] of Object.entries({
      brief: Brief,
      presenter: Presenter,
      product: Product,
      voice: Voice,
      run: Run,
      ledger: Ledger,
      review: ReviewItem,
      renderPlan: RenderPlan
    }))
      await atomic(`schemas/auto-factory/${name}.json`, z.toJSONSchema(schema));
  } else
    console.log(JSON.stringify(await run(root)));
}
