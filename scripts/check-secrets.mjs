#!/usr/bin/env node
/**
 * Static scan for secrets / sensitive keys that must not ship to the frontend
 * or be hard-coded in the monorepo.
 *
 * Usage: node scripts/check-secrets.mjs
 * Exit 1 if high-risk findings are detected in client bundles or source.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".migration-backup",
]);

const CLIENT_GLOBS = [
  "artifacts/web/src",
  "artifacts/admin/src",
  "artifacts/mockup-sandbox/src",
  "lib/api-client-react/src",
];

/** Patterns that must never appear in frontend source. */
const CLIENT_FORBIDDEN = [
  { name: "Stripe secret key", re: /sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]{10,}/ },
  { name: "AWS secret key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key PEM", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Database URL with password", re: /postgres(ql)?:\/\/[^:]+:[^@\s]+@/i },
  { name: "Generic secret assignment in client", re: /(SECRET|PRIVATE_KEY|STRIPE_SECRET|SESSION_SECRET|DATABASE_URL)\s*[:=]/ },
  { name: "JWT secret hardcode", re: /jwt[_-]?secret\s*[:=]\s*['"][^'"]+['"]/i },
];

/** Repo-wide high severity (except known safe paths). */
const REPO_FORBIDDEN = [
  { name: "Hard-coded Stripe live secret", re: /sk_live_[A-Za-z0-9]{20,}/ },
  { name: "Hard-coded private key", re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
];

const findings = [];

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, onFile);
    else if (st.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs|json|env|html)$/i.test(name)) {
      if (name.endsWith(".map")) continue;
      onFile(full);
    }
  }
}

function scanFile(file, rules, scope) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  // skip this scanner itself
  if (file.endsWith("check-secrets.mjs")) return;

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//") && line.includes("example")) continue;
    for (const rule of rules) {
      if (rule.re.test(line)) {
        findings.push({
          scope,
          rule: rule.name,
          file: relative(ROOT, file),
          line: i + 1,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }
}

// Frontend trees
for (const rel of CLIENT_GLOBS) {
  walk(join(ROOT, rel), (f) => scanFile(f, CLIENT_FORBIDDEN, "client"));
}

// Also flag VITE_ vars that look like secrets (not public tokens)
walk(join(ROOT, "artifacts"), (f) => {
  if (!f.includes(`${join("src")}`) && !f.endsWith(".env") && !f.includes(".env.")) return;
  let text;
  try {
    text = readFileSync(f, "utf8");
  } catch {
    return;
  }
  const badVite = /VITE_(SESSION_SECRET|DATABASE_URL|STRIPE_SECRET|JWT_SECRET|PRIVATE)/i;
  if (badVite.test(text)) {
    findings.push({
      scope: "client-env",
      rule: "Sensitive var exposed via VITE_ prefix",
      file: relative(ROOT, f),
      line: 0,
      snippet: text.match(badVite)?.[0] ?? "",
    });
  }
});

// Repo-wide critical
walk(ROOT, (f) => scanFile(f, REPO_FORBIDDEN, "repo"));

// Report public frontend env usage (informational)
const publicEnv = [];
walk(join(ROOT, "artifacts/web/src"), (f) => {
  const text = readFileSync(f, "utf8");
  const re = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(text))) publicEnv.push({ file: relative(ROOT, f), key: m[1] });
});
walk(join(ROOT, "artifacts/admin/src"), (f) => {
  const text = readFileSync(f, "utf8");
  const re = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(text))) publicEnv.push({ file: relative(ROOT, f), key: m[1] });
});

console.log("=== Public frontend env keys (expected to be non-secret) ===");
const uniq = [...new Set(publicEnv.map((p) => p.key))].sort();
for (const k of uniq) console.log(`  ${k}`);
if (uniq.length === 0) console.log("  (none found)");

console.log("\n=== Findings ===");
if (findings.length === 0) {
  console.log("  No high-risk secret exposures detected.");
  process.exit(0);
}

for (const f of findings) {
  console.log(`  [${f.scope}] ${f.rule}`);
  console.log(`    ${f.file}:${f.line}`);
  console.log(`    ${f.snippet}`);
}
process.exit(1);
