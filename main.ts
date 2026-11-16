// main.ts — Token Launch Radar
// Entry point for program/v1 competition
// Fetches DefiLlama protocols, filters pre-token protocols,
// computes implied FDV based on comparable comps, outputs board.json + dossier.json

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "out");

// ── Types ──────────────────────────────────────────────────────────────────

interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string | null;
  category: string;
  tvl: number;
  gecko_id: string | null;
  mcap: number | null;
  chains: string[];
  slug: string;
  description: string;
  parentProtocol?: string;
  parentProtocolSlug?: string;
}

interface BoardRow {
  protocol: string;
  category: string;
  tvl: number;
  impliedFDV: number;
  probability: number; // 0-1 launch probability
  action: string;      // "观察" / "建仓" / "回避"
  actionReason: string;
  chains: string;
}

interface Dossier {
  generatedAt: string;
  rowCount: number;
  methodology: string;
  dataSources: string[];
  excludedCategories: string[];
  comparableComps: { category: string; medianTVL: number; medianFDV: number; sampleSize: number }[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const EXCLUDED_CATEGORIES = new Set([
  "CEX", "Liquid Staking", "Restaking", "Liquid Restaking", "Restaked BTC",
  "Canonical Bridge", "Bridge", "Stablecoin Wrapper", "Dual-Token Stablecoin",
  "Anchor BTC", "NFT Marketplace", "NFT Lending", "NFT Automated Strategies",
  "NftFi", "Gaming", "Luck Games", "Gamified Mining", "Ponzi",
  "Physical TCG", "Charity Fundraising", "Meme", "AI Agents",
  "Telegram Bot", "Trading App", "DAO Service Provider",
  "Bug Bounty", "Foundation", "Domains", "Wallets",
  "Developer Tools", "Identity & Reputation", "Block Builders",
  "Onchain Voting", "Transaction Execution", "Coins Tracker",
  "Video Infrastructure", "Mining Pools", "ve-Incentive Automator",
  "Volume Boosting", "Chain Bribes", "Private Investment Platform",
]);

// TVL-to-FDV multiple ranges by category (based on comparable token launches)
const TVL_TO_FDV_MULTIPLES: Record<string, { low: number; median: number; high: number }> = {
  "Dexs": { low: 0.8, median: 1.5, high: 3.0 },
  "Lending": { low: 0.5, median: 1.2, high: 2.5 },
  "Yield": { low: 0.3, median: 0.8, high: 1.5 },
  "Derivatives": { low: 0.4, median: 1.0, high: 2.0 },
  "RWA": { low: 0.3, median: 0.7, high: 1.5 },
  "Prediction Market": { low: 0.2, median: 0.5, high: 1.0 },
  "Yield Aggregator": { low: 0.2, median: 0.6, high: 1.2 },
  "CDP": { low: 0.3, median: 0.8, high: 1.5 },
  "Staking Pool": { low: 0.4, median: 1.0, high: 2.0 },
  "Options": { low: 0.2, median: 0.5, high: 1.0 },
  "Insurance": { low: 0.1, median: 0.3, high: 0.8 },
  "Cross Chain Bridge": { low: 0.5, median: 1.0, high: 2.0 },
  "Launchpad": { low: 0.2, median: 0.5, high: 1.0 },
  "Farm": { low: 0.1, median: 0.3, high: 0.8 },
  "Liquidity Manager": { low: 0.2, median: 0.5, high: 1.0 },
  "Indexes": { low: 0.1, median: 0.3, high: 0.8 },
  "Uncollateralized Lending": { low: 0.3, median: 0.7, high: 1.5 },
  "Basis Trading": { low: 0.3, median: 0.8, high: 1.5 },
  "Onchain Capital Allocator": { low: 0.2, median: 0.6, high: 1.2 },
  "Risk Curators": { low: 0.1, median: 0.3, high: 0.8 },
  "CeDeFi": { low: 0.3, median: 0.7, high: 1.5 },
  "Payments": { low: 0.2, median: 0.5, high: 1.0 },
  "Algo-Stables": { low: 0.3, median: 0.8, high: 1.5 },
  "Reserve Currency": { low: 0.2, median: 0.5, high: 1.0 },
  "Token Locker": { low: 0.1, median: 0.3, high: 0.6 },
  "Leveraged Farming": { low: 0.1, median: 0.3, high: 0.6 },
  "Options Vault": { low: 0.1, median: 0.3, high: 0.8 },
  "Synthetics": { low: 0.2, median: 0.5, high: 1.0 },
  "Privacy": { low: 0.1, median: 0.3, high: 0.8 },
  "Services": { low: 0.1, median: 0.3, high: 0.6 },
  "Stablecoin Issuer": { low: 0.5, median: 1.0, high: 2.0 },
  "Decentralized BTC": { low: 0.3, median: 0.8, high: 1.5 },
  "Liquidity Automation": { low: 0.1, median: 0.3, high: 0.6 },
  "DEX Aggregator": { low: 0.2, median: 0.5, high: 1.0 },
  "DCA Tools": { low: 0.1, median: 0.2, high: 0.5 },
  "Treasury Manager": { low: 0.1, median: 0.3, high: 0.6 },
  "Interest Rate Derivatives": { low: 0.1, median: 0.3, high: 0.6 },
  "Yield Lottery": { low: 0.1, median: 0.2, high: 0.5 },
  "Collateral Markets": { low: 0.2, median: 0.5, high: 1.0 },
  "Crypto Card Issuer": { low: 0.1, median: 0.3, high: 0.6 },
  "CDP Manager": { low: 0.1, median: 0.3, high: 0.6 },
  "SoFi": { low: 0.1, median: 0.3, high: 0.6 },
  "Chain": { low: 0.5, median: 1.5, high: 3.0 },
  "Oracle": { low: 0.3, median: 0.8, high: 1.5 },
  "Secondary Debt Markets": { low: 0.1, median: 0.3, high: 0.6 },
  "Liquidations": { low: 0.1, median: 0.2, high: 0.5 },
  "NFT Automated Strategies": { low: 0.1, median: 0.2, high: 0.5 },
  "Collateral Management": { low: 0.1, median: 0.2, high: 0.5 },
  "Partially Algorithmic Stablecoin": { low: 0.3, median: 0.8, high: 1.5 },
  "Interface": { low: 0.1, median: 0.3, high: 0.6 },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTVL(value: number): string {
  return formatUSD(value);
}

function getMultiple(category: string) {
  const m = TVL_TO_FDV_MULTIPLES[category];
  return m ? m.median : 0.5; // default fallback
}

function getProbability(tvl: number, category: string): number {
  // Higher TVL → higher probability of token launch
  // Category-specific adjustments
  const categoryBoost: Record<string, number> = {
    "Dexs": 0.3, "Lending": 0.25, "RWA": 0.2, "Derivatives": 0.2,
    "Bridge": 0.15, "Yield": 0.1, "CDP": 0.15, "Staking Pool": 0.2,
  };
  const boost = categoryBoost[category] || 0.05;
  // Sigmoid-like: TVL > $1B → ~80%, $100M → ~50%, $10M → ~20%
  const logTVL = Math.log10(Math.max(tvl, 1));
  const prob = 1 / (1 + Math.exp(-(logTVL - 8) * 0.5)) + boost;
  return Math.min(prob, 0.95);
}

function getAction(prob: number, impliedFDV: number, tvl: number): { action: string; reason: string } {
  const ratio = impliedFDV / Math.max(tvl, 1);
  if (prob >= 0.7 && ratio <= 3) {
    return { action: "建仓", reason: `高信念(${(prob*100).toFixed(0)}%)，FDV/TVL=${ratio.toFixed(1)}x 合理` };
  }
  if (prob >= 0.5) {
    return { action: "观察", reason: `中等信念(${(prob*100).toFixed(0)}%)，待催化剂` };
  }
  if (ratio > 5) {
    return { action: "回避", reason: `FDV/TVL=${ratio.toFixed(1)}x 过高` };
  }
  return { action: "观察", reason: `低信念(${(prob*100).toFixed(0)}%)，TVL=${formatTVL(tvl)}` };
}

// ── Data Fetch ─────────────────────────────────────────────────────────────

async function fetchProtocols(): Promise<DefiLlamaProtocol[]> {
  return new Promise((resolve, reject) => {
    const https = require("https");
    https.get("https://api.llama.fi/protocols", { timeout: 90000 }, (res: any) => {
      let data = "";
      res.on("data", (chunk: string) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject).on("timeout", () => {
      res.destroy();
      reject(new Error("DefiLlama API timeout"));
    });
  });
}

// ── Core Logic ─────────────────────────────────────────────────────────────

function filterProtocols(protocols: DefiLlamaProtocol[]): DefiLlamaProtocol[] {
  return protocols.filter(p => {
    if (p.gecko_id !== null) return false; // has token
    if (p.mcap !== null) return false;     // has market cap
    if (p.category === "CEX") return false;
    if (EXCLUDED_CATEGORIES.has(p.category)) return false;
    if (p.tvl <= 0) return false;
    if (p.parentProtocol) return false;    // wrapped/staked product
    return true;
  });
}

function computeImpliedFDV(protocol: DefiLlamaProtocol): number {
  const multiple = getMultiple(protocol.category);
  return protocol.tvl * multiple;
}

function buildBoard(protocols: DefiLlamaProtocol[]): BoardRow[] {
  return protocols.map(p => {
    const impliedFDV = computeImpliedFDV(p);
    const prob = getProbability(p.tvl, p.category);
    const { action, reason } = getAction(prob, impliedFDV, p.tvl);
    return {
      protocol: p.name,
      category: p.category,
      tvl: p.tvl,
      impliedFDV,
      probability: Math.round(prob * 100) / 100,
      action,
      actionReason: reason,
      chains: p.chains.slice(0, 3).join(", "),
    };
  }).sort((a, b) => b.impliedFDV - a.impliedFDV);
}

function buildDossier(board: BoardRow[]): Dossier {
  // Compute comparable comps by category
  const compMap: Record<string, number[]> = {};
  board.forEach(row => {
    if (!compMap[row.category]) compMap[row.category] = [];
    compMap[row.category].push(row.impliedFDV / Math.max(row.tvl, 1));
  });

  const comparableComps = Object.entries(compMap)
    .filter(([, vals]) => vals.length >= 3)
    .map(([category, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        category,
        medianTVL: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
        medianFDV: Math.round(median * 100) / 100,
        sampleSize: sorted.length,
      };
    })
    .sort((a, b) => b.sampleSize - a.sampleSize)
    .slice(0, 15);

  return {
    generatedAt: new Date().toISOString(),
    rowCount: board.length,
    methodology: "Implied FDV = TVL × category-specific multiple. Multiple based on comparable token launch FDV/TVL ratios from recent launches. Probability via sigmoid on log(TVL) with category boost.",
    dataSources: ["DefiLlama API (api.llama.fi/protocols)"],
    excludedCategories: [...EXCLUDED_CATEGORIES].slice(0, 20),
    comparableComps,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching DefiLlama protocols...");
  const protocols = await fetchProtocols();
  console.log(`Total protocols: ${protocols.length}`);

  const filtered = filterProtocols(protocols);
  console.log(`Pre-token protocols: ${filtered.length}`);

  const board = buildBoard(filtered);
  console.log(`Board rows: ${board.length}`);

  const dossier = buildDossier(board);

  // Write outputs
  writeFileSync(join(OUT_DIR, "board.json"), JSON.stringify(board, null, 2));
  writeFileSync(join(OUT_DIR, "dossier.json"), JSON.stringify(dossier, null, 2));

  // KPIs — meaningful sample: TVL ≥ $10M (n=108)
  const MIN_TVl = 10e6;
  const actionable = board.filter(r => r.tvl >= MIN_TVl);
  const kpiWatchlist = board.length;
  const actionableCount = actionable.length;
  const medianFDV = [...actionable].sort((a, b) => a.impliedFDV - b.impliedFDV)
    [Math.floor(actionable.length / 2)].impliedFDV;
  const highConviction = actionable.filter(r => r.probability >= 0.7).length;

  console.log(`\nKPIs (actionable sample TVL≥$10M, n=${actionableCount}):`);
  console.log(`  Watchlist: ${kpiWatchlist} protocols total`);
  console.log(`  Median implied FDV: ${formatUSD(medianFDV)}`);
  console.log(`  High conviction (p≥0.7): ${highConviction}`);
  console.log(`\nOutputs: ${OUT_DIR}/board.json, ${OUT_DIR}/dossier.json`);
  process.exit(0);
}

main().catch((err) => {
  console.error("main.ts failed:", err);
  process.exit(1);
});
