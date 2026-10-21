import { createServer, type IncomingMessage } from "node:http";
import { DemoStore } from "./core.ts";
const store = new DemoStore();
await store.init();
async function body(req: IncomingMessage) {
  let chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw Error("REQUEST_TOO_LARGE");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
const server = createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  const send = (status: number, value: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(value));
  };
  try {
    const host = req.headers.host;
    if (!host || !/^127\.0\.0\.1:4174$/.test(host)) throw Error("LOCAL_ONLY");
    if (req.method === "POST") {
      const origin = req.headers.origin;
      if (
        origin &&
        !["http://127.0.0.1:5173", "http://127.0.0.1:4174"].includes(origin)
      )
        throw Error("ORIGIN_REJECTED");
      if (req.headers["content-type"]?.split(";")[0] !== "application/json")
        throw Error("JSON_REQUIRED");
    }
    const path = new URL(req.url || "/", "http://127.0.0.1:4174").pathname;
    if (req.method === "GET" && path === "/api/overview")
      return send(200, store.overview());
    if (req.method === "GET" && path === "/api/jobs")
      return send(200, store.overview().jobs);
    if (req.method === "GET" && path === "/api/usage")
      return send(200, store.overview().budget);
    if (req.method === "GET" && path === "/api/presenter")
      return send(200, store.overview().presenter);
    if (req.method === "GET" && path === "/api/voices")
      return send(200, store.overview().voices);
    if (req.method === "POST" && path === "/api/jobs/draft")
      return send(201, store.create(await body(req)));
    if (req.method === "POST" && path === "/api/products/validate-input")
      return send(200, store.validateProduct(await body(req)));
    let m = path.match(
      /^\/api\/jobs\/(offline-[a-z-]+|demo-[0-9]+)\/(review|media|qa)$/,
    );
    if (m && req.method === "POST" && m[2] === "review")
      return send(200, store.review(m[1], await body(req)));
    if (m && req.method === "GET" && m[2] === "qa") {
      const j = store.overview().jobs.find((x) => x.id === m[1]);
      return j ? send(200, j.qa) : send(404, { error: "JOB_NOT_FOUND" });
    }
    if (m && req.method === "GET" && m[2] === "media") {
      const bytes = await store.mediaFor(m[1]);
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": bytes.length,
        "Accept-Ranges": "none",
        "Content-Disposition": "inline",
        "X-Robots-Tag": "noindex, nofollow",
      });
      return res.end(bytes);
    }
    return send(404, { error: "NOT_FOUND" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INVALID_INPUT";
    const safe =
      /^(?:LOCAL_ONLY|ORIGIN_REJECTED|JSON_REQUIRED|REQUEST_TOO_LARGE|JOB_NOT_FOUND|MEDIA_UNAVAILABLE|MEDIA_INTEGRITY_FAILED|STALE_REVISION|ARTIFACT_HASH_MISMATCH|REVIEW_NOT_PENDING|INVALID_SHOT|UNSAFE_URL|UNSUPPORTED_DOMAIN|INVALID_PRODUCT_URL|CLAIM_REQUIRES_MATCHING_FIELD_EVIDENCE|EVIDENCE_STALE_OR_FUTURE|PRICE_REQUIRES_SEPARATE_FRESH_EVIDENCE|FAKE_HANDS_ON)$/.test(
        msg,
      )
        ? msg
        : "INVALID_INPUT";
    send(
      safe === "MEDIA_UNAVAILABLE" || safe === "JOB_NOT_FOUND"
        ? 404
        : safe === "STALE_REVISION" || safe === "ARTIFACT_HASH_MISMATCH"
          ? 409
          : 400,
      { error: safe },
    );
  }
});
server.listen(4174, "127.0.0.1", () =>
  console.log("MOCK_OFFLINE API: http://127.0.0.1:4174"),
);
