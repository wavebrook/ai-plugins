// Checks a ChatGPT plugin package against OpenAI's submission rules
// (developers.openai.com/plugins/deploy/submission): listing limits, the
// four URLs MCP review needs, icons, exactly one MCP server, and exactly
// 5 positive + 3 negative review cases.
// Run: node scripts/openai-check.mjs <plugin root> [--require-demo]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const requireDemo = process.argv.includes('--require-demo');
const MCP_URL = 'https://mcp.wavebrook.com/mcp';
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

const manifest = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8'));
const mcp = JSON.parse(readFileSync(join(root, 'mcp.json'), 'utf8'));
const openai = manifest.extensions?.['com.openai'] ?? {};
const ui = openai.interface ?? {};

const max = (path, value, n) => {
  if (typeof value !== 'string' || !value) err(`${path} is required`);
  else if (value.length > n) err(`${path} is ${value.length} characters (max ${n})`);
};
const https = (path, value) => {
  max(path, value, 1024);
  if (value && !/^https:\/\/[^@\s]+$/.test(value)) err(`${path} must be an HTTPS URL without credentials`);
};

// Package identity
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name ?? '') || manifest.name.length > 64) {
  err('name must be lowercase letters, numbers and single hyphens, max 64');
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? '')) err('version must be semver, e.g. 1.0.0');

// Listing
max('displayName', ui.displayName, 30);
max('shortDescription', ui.shortDescription, 30);
max('longDescription', ui.longDescription, 4000);
max('developerName', ui.developerName, 80);
max('category', ui.category, 200);
for (const k of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) https(k, ui[k]);
const caps = ui.capabilities ?? [];
if (caps.length > 20 || caps.some((c) => c.length > 120)) err('capabilities: max 20, 120 characters each');
const prompts = [].concat(ui.defaultPrompt ?? []);
if (prompts.length > 3) err('defaultPrompt: max 3');
prompts.forEach((p, i) => p.length > 128 && err(`defaultPrompt[${i}] is ${p.length} characters (max 128)`));
if (new Set(prompts).size !== prompts.length) err('defaultPrompt entries must be unique');
for (const k of ['brandColor', 'brandColorDark']) {
  if (ui[k] && !/^#[0-9A-Fa-f]{6}$/.test(ui[k])) err(`${k} must be #RRGGBB`);
}

// Images: ./-relative, present, ≤ 5 MiB, square PNG ≥ 48 px (≤ 4096)
const pngSize = (file) => {
  const b = readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
for (const k of ['logo', 'logoDark', 'composerIcon', 'composerIconDark']) {
  const rel = ui[k];
  if (!rel) {
    if (k === 'logo' || k === 'composerIcon') err(`${k} is required`);
    continue;
  }
  if (!rel.startsWith('./')) err(`${k} must be a ./-relative path`);
  const file = join(root, rel);
  if (!existsSync(file)) {
    err(`${k}: ${rel} is missing`);
    continue;
  }
  if (statSync(file).size > 5 * 1024 * 1024) err(`${k}: larger than 5 MiB`);
  const size = pngSize(file);
  if (!size) err(`${k}: expected a PNG`);
  else if (size[0] !== size[1] || size[0] < 48 || size[0] > 4096) err(`${k}: ${size.join('x')}, must be square, 48–4096 px`);
}

// MCP: exactly one server, the production URL
const servers = Object.entries(mcp.mcpServers ?? {});
if (servers.length !== 1) err(`mcp.json must declare exactly one server (has ${servers.length})`);
else if (servers[0][1].url !== MCP_URL) err(`mcp.json URL is ${servers[0][1].url}, expected ${MCP_URL}`);
if (openai.apps || openai.hooks) err('app references and lifecycle hooks cannot be submitted');

// Skills: each SKILL.md has a name and description in its YAML header
const skillsDir = join(root, 'skills');
if (existsSync(skillsDir)) {
  for (const name of readdirSync(skillsDir)) {
    const md = join(skillsDir, name, 'SKILL.md');
    if (!existsSync(md)) continue;
    const head = readFileSync(md, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    if (!/^name: \S/m.test(head) || !/^description: \S/m.test(head)) err(`skills/${name}/SKILL.md needs name and description`);
  }
}

// Review
const review = openai.review ?? {};
const pos = review.test_cases?.positive ?? [];
const neg = review.test_cases?.negative ?? [];
if (pos.length !== 5) err(`exactly 5 positive test cases required (has ${pos.length})`);
if (neg.length !== 3) err(`exactly 3 negative test cases required (has ${neg.length})`);
pos.forEach((c, i) => {
  for (const k of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
    if (!c[k]) err(`positive[${i}].${k} is required`);
  }
  if (c.description?.length > 4000) err(`positive[${i}].description over 4000 characters`);
});
neg.forEach((c, i) => ['description', 'prompt'].forEach((k) => !c[k] && err(`negative[${i}].${k} is required`)));
if ('test_credentials' in review || 'reviewer_instructions' in review) {
  err('credentials and reviewer instructions go in the dashboard form, never in the package');
}
if (!review.demo_recording_url) {
  (requireDemo ? errors : warnings).push('review.demo_recording_url is missing (required before submitting for review)');
} else https('review.demo_recording_url', review.demo_recording_url);

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${manifest.name} ${manifest.version} is ready for the OpenAI Platform`);
