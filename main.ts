// main.ts — Token Launch Radar
// Entry point for program/v1 competition
// Runs on Node 22+: fetches DefiLlama data, filters pre-token protocols,
// computes implied FDV, outputs board.json + dossier.json

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "out");

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  // TODO T2: fetch DefiLlama protocols, filter, compute implied value
  // For now, output empty structures to verify exit 0
  const board = [];
  const dossier = { generatedAt: new Date().toISOString(), rowCount: 0 };

  writeFileSync(join(OUT_DIR, "board.json"), JSON.stringify(board, null, 2));
  writeFileSync(join(OUT_DIR, "dossier.json"), JSON.stringify(dossier, null, 2));

  console.log("main.ts: done (skeleton)");
  process.exit(0);
}

main().catch((err) => {
  console.error("main.ts failed:", err);
  process.exit(1);
});
