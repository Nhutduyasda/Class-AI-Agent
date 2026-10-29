import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { Policy, Plan, Authorization, Event, Journal, Payload } from "../../../src/auto-factory/control/model.ts";

await mkdir("schemas/auto-factory/control", {
  recursive: true
});

for (const [name, schema] of Object.entries({
  policy: Policy,
  plan: Plan,
  authorization: Authorization,
  event: Event,
  journal: Journal,
  payload: Payload
}))
  await writeFile(`schemas/auto-factory/control/${name}.json`, JSON.stringify(z.toJSONSchema(schema), null, 2) + "\n");
