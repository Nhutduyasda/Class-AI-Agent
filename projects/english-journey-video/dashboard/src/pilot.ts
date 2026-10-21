import { z } from "zod";
export const PilotState = z
  .strictObject({
    productionJobId: z.string().min(1),
    scriptVersion: z.string().min(1),
    scriptSha256: z.string().regex(/^[a-f0-9]{64}$/),
    approvedScriptSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    mediaProvenance: z.enum([
      "MISSING",
      "SYNTHETIC_OFFLINE",
      "AUTHORIZED_SPEECH",
    ]),
    voiceConfiguration: z.tuple([
      z.literal("vi-VN-NamMinhNeural"),
      z.literal("en-US-AndrewNeural"),
    ]),
    audioStatus: z.enum(["BLOCKED", "IMPORTED"]),
    renderStatus: z.enum(["NOT_STARTED", "RENDERED"]),
    qaStatus: z.enum(["NOT_EVALUATED", "TECHNICAL_ONLY"]),
    ownerDecision: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
    paidExecutionAllowed: z.literal(false),
    publicationAllowed: z.literal(false),
  })
  .superRefine((p, c) => {
    if (
      p.approvedScriptSha256 !== null &&
      p.approvedScriptSha256 !== p.scriptSha256
    )
      c.addIssue({ code: "custom", message: "STALE_SCRIPT_APPROVAL" });
    if (p.audioStatus === "IMPORTED" && p.mediaProvenance === "MISSING")
      c.addIssue({ code: "custom", message: "MISSING_MEDIA" });
    if (p.renderStatus === "RENDERED" && p.audioStatus !== "IMPORTED")
      c.addIssue({ code: "custom", message: "MISSING_AUDIO" });
  });
