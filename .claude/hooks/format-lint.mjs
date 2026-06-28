#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit): auto-format and lint the single file
// that was just changed, scoped to Claude's own edit so feedback stays relevant.
//
// - Prettier --write   : always, fast, deterministic formatting.
// - ESLint --fix       : best-effort auto-fix; remaining errors are surfaced to
//                        Claude (exit 2) so it fixes what it introduced.
//
// The repo uses legacy `.eslintrc.json` per package, so we force ESLint's legacy
// config resolution via ESLINT_USE_FLAT_CONFIG=false.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let data;
try {
  data = JSON.parse(raw || '{}');
} catch {
  process.exit(0);
}

const fp = data?.tool_input?.file_path;
if (!fp) process.exit(0);

// Only touch TS/JS source files inside the workspace source dirs.
if (!/\.(ts|tsx|js|jsx)$/.test(fp)) process.exit(0);
if (!/(^|\/)(apps|packages|tools)\//.test(fp)) process.exit(0);
if (!existsSync(fp)) process.exit(0);

const q = (s) => `'${s.replace(/'/g, "'\\''")}'`;
const env = { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' };

// 1) Format — never blocks.
try {
  execSync(`npx prettier --write ${q(fp)}`, { stdio: 'ignore', env });
} catch {
  // prettier not applicable to this file / parser error — ignore.
}

// 2) Lint with auto-fix — surface anything left over.
try {
  execSync(`npx eslint --fix --no-error-on-unmatched-pattern ${q(fp)}`, {
    stdio: 'pipe',
    env,
  });
} catch (e) {
  const out =
    (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  // If ESLint itself failed to run (config/parse error), don't block the agent.
  if (/Parsing error|Cannot read config|No ESLint configuration|Failed to load/i.test(out)) {
    process.exit(0);
  }
  process.stderr.write(
    `ESLint reported issues in ${fp} (auto-fixable ones already applied). ` +
      `Please resolve the remaining problems:\n${out}\n`
  );
  process.exit(2); // feed back to Claude
}

process.exit(0);
