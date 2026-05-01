// Run with: pnpm export:sample-replay
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createSampleCombatReplayExport } from "../dist/src/debug/sampleCombatReplayExport.js";

const outputDir = join(process.cwd(), "debug", "combat-replays");
const outputPath = join(outputDir, `sample-combat-replay-${new Date().toISOString().replaceAll(":", "-")}.json`);
const payload = createSampleCombatReplayExport();

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
