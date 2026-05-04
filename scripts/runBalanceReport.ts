// Run with: pnpm balance:report
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createBalanceReport, renderMarkdownReport } from "../dist/src/debug/BalanceReport.js";

const outputDir = join(process.cwd(), "debug", "balance-reports");
const jsonPath = join(outputDir, "latest.json");
const markdownPath = join(outputDir, "latest.md");
const report = createBalanceReport();

mkdirSync(outputDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(markdownPath, renderMarkdownReport(report));
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${markdownPath}`);
