#!/usr/bin/env node
/**
 * Spec 0001 mechanical checks: grep bans + token contrast.
 * Run: node scripts/check-design.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * ripgrep is not installed everywhere (it is absent from a stock macOS and from
 * most CI images unless asked for), and this script silently never ran because
 * of it. POSIX grep is always present, so it is the default and `rg` is only
 * used when it is genuinely there. Both patterns below are plain ERE, which the
 * two engines agree on.
 */
const HAS_RG = (() => {
  try {
    execSync("command -v rg", { stdio: "ignore", shell: "/bin/sh" });
    return true;
  } catch {
    return false;
  }
})();

function grep(pattern, paths) {
  const quoted = paths.map((p) => `'${p}'`).join(" ");
  const cmd = HAS_RG
    ? `rg -n --glob '!*.md' -e ${JSON.stringify(pattern)} ${quoted}`
    : `grep -rnE --exclude='*.md' -e ${JSON.stringify(pattern)} ${quoted}`;
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8", shell: "/bin/sh" }).trim();
  } catch (err) {
    // Both tools exit 1 for "no matches", which is the passing case here.
    if (err.status === 1) return "";
    throw err;
  }
}

const failures = [];

function ban(name, pattern, paths) {
  const hit = grep(pattern, paths);
  if (hit) failures.push(`${name}:\n${hit}`);
}

ban("arbitrary px type", String.raw`text-\[[0-9.]+px\]`, ["app", "components"]);
ban("alpha white borders", String.raw`border-white/[0-9]|bg-white/[0-9]`, ["app", "components"]);
ban("gradients", "gradient", ["app", "components", "lib"]);
ban("font-extrabold", "font-extrabold", ["app", "components"]);
ban("legacy app tokens", "--color-app-", ["app", "components", "lib"]);
ban("banned copy", String.raw`command center|protect what matters|seamless|empower|trusted partner|peace of mind|cutting-edge|one-stop`, [
  "app",
  "components",
  "lib",
]);
ban("gold text on paper", String.raw`text-brand`, ["app/(marketing)", "components/marketing"]);

// --- spec 0001, decisions the first version of this script did not cover ----
// Each of these shipped as a real violation and was only found by hand, which
// is the argument for having them here.

// Tailwind's default type scale is not this system's scale. text-sm is 14px,
// which falls between --text-body (15) and --text-body-sm (13) and resolves to
// neither token — the kind of leak the arbitrary-px ban above does not catch.
ban(
  "default Tailwind type scale",
  String.raw`\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\b`,
  ["app", "components"],
);

// Decision: 600 is the heaviest weight in the system. font-bold is 700.
ban("font-bold (600 is the max weight)", "font-bold", ["app", "components"]);

// Untokenised colour. Both also appeared alongside a real token on the same
// element, so the two fought.
ban("untokenised black/white", String.raw`text-white|text-black|bg-white\b`, ["app", "components"]);

// Tailwind's default ramp is not the palette. Five semantic colours only.
ban(
  "off-system colour ramp",
  String.raw`(bg|text|border)-(green|red|blue|slate|amber|violet|indigo|orange|emerald)-[0-9]`,
  ["app", "components"],
);

// These resolve to nothing now that the v1 token block is gone, so the style
// silently disappears rather than erroring.
ban(
  "deleted app-* colour tokens",
  String.raw`(bg|text|border)-app-(gold|info|warning|card|bg|sidebar|border|disabled)`,
  ["app", "components"],
);

// Decision 4: pill radius is for status chips and avatars. A control with real
// padding and a body/label type token is a button, and takes --radius-sm.
ban(
  "pill radius on an action control",
  String.raw`rounded-full[^"']*(px-[4-9]|py-[23]|py-2\.5|py-3\.5)[^"']*text-body`,
  ["app", "components"],
);

// A transition on a property nothing changes — left behind by a removed press
// effect, and it reads as an animation that does not exist.
ban("dead transition-transform", String.raw`transition-transform\s+["']`, ["app", "components"]);

// --- spec 0002 ------------------------------------------------------------
// The client is charged once, in full. Provider payout mechanics are not the
// client's business and the split they described no longer exists on v6.
// Scoped to the money sense of the words: "created upfront" is a true and
// necessary statement about recurring occurrences, and must not trip this.
ban(
  "provider payout schedule in client copy",
  String.raw`30% (of|upfront|advance)|70% (after|on|at)|paid upfront|charged upfront|upfront payment`,
  ["app", "components", "lib"],
);

// Provider economics and the rate snapshot ride along on the quote because the
// same object serves settlement. They must never reach the DOM.
ban(
  "provider economics rendered",
  String.raw`providerNetPaise|platformRetainedPaise|providerPayableGrossPaise|tcsPaise|tdsPaise`,
  ["app", "components/marketing"],
);

// Emoji, anywhere in product or marketing UI.
{
  const files = execSync(
    "find app components -name '*.tsx' -o -name '*.ts'",
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  const hits = [];
  for (const rel of files) {
    const text = readFileSync(join(root, rel), "utf8");
    for (const m of text.matchAll(/\p{Extended_Pictographic}/gu)) {
      hits.push(`${rel}:${text.slice(0, m.index).split("\n").length}  ${m[0]}`);
    }
  }
  if (hits.length) failures.push(`emoji in UI:\n${hits.join("\n")}`);
}

// The landing page's real JS budget is its island count, not a byte total that
// is dominated by framework baseline. Two are sanctioned: the mobile nav sheet
// and the cost calculator. A third means a library arrived.
{
  const marketing = execSync(
    "find 'app/(marketing)' components/marketing -name '*.tsx'",
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  const islands = marketing.filter((rel) =>
    /^\s*["']use client["']/m.test(readFileSync(join(root, rel), "utf8")),
  );
  if (islands.length > 2) {
    failures.push(
      `marketing client islands: expected at most 2, found ${islands.length}:\n${islands.join("\n")}`,
    );
  }
}

const css = readFileSync(join(root, "app/globals.css"), "utf8");
const radii = [...css.matchAll(/--radius-[a-z]+:/g)].map((m) => m[0]);
if (radii.length !== 3) {
  failures.push(`expected 3 radius tokens, found ${radii.join(" ")}`);
}

function hexToRgb(hex) {
  const n = hex.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255,
  ];
}

function lin(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function lum([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [l1, l2] = [lum(hexToRgb(a)), lum(hexToRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const pairs = [
  ["ink on paper", "#12100e", "#fbfaf8", 4.5],
  ["ink-mid on paper", "#5c5852", "#fbfaf8", 4.5],
  ["ink-faint on paper (14px+)", "#746f68", "#fbfaf8", 4.5],
  ["edge on paper", "#8a857c", "#fbfaf8", 3],
  ["ground-ink on ground", "#f2f4f7", "#0a0e14", 4.5],
  ["ground-mid on ground", "#98a2b3", "#0a0e14", 4.5],
  ["ground-faint on ground", "#7d8795", "#0a0e14", 4.5],
  ["ground-edge on ground", "#5a6577", "#0a0e14", 3],
  ["brand on ground", "#e8a020", "#0a0e14", 4.5],
  ["brand-ink on brand", "#1a1203", "#e8a020", 4.5],
  ["gold on paper (must fail as body text)", "#e8a020", "#fbfaf8", 4.5],
];

for (const [label, fg, bg, min] of pairs) {
  const ratio = contrast(fg, bg);
  if (label.startsWith("gold on paper")) {
    if (ratio >= min) failures.push(`${label}: ${ratio.toFixed(2)} unexpectedly passes AA`);
    continue;
  }
  if (ratio < min) failures.push(`${label}: ${ratio.toFixed(2)} < ${min}`);
}

if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}
console.log("spec 0001 design checks passed");
