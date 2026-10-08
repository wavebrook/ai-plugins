// Checks every JSON file parses, the MCP URL is the same everywhere and
// manifest versions match. Run: node scripts/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const URL_ = 'https://mcp.wavebrook.com/mcp';
const errors = [];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === '.git' || e.name === 'node_modules'
      ? []
      : e.isDirectory()
        ? walk(join(dir, e.name))
        : [join(dir, e.name)],
  );
const files = walk(root);

const json = {};
for (const f of files.filter((f) => f.endsWith('.json'))) {
  try {
    json[f.slice(root.length)] = JSON.parse(readFileSync(f, 'utf8'));
  } catch (e) {
    errors.push(`${f.slice(root.length)}: ${e.message}`);
  }
}

// Any MCP-looking URL in any text file must be the canonical one.
for (const f of files.filter((f) => /\.(json|md|toml)$/.test(f))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)<>]*\/mcp(?![\w.-])/g)) {
    if (m[0] !== URL_) errors.push(`${f.slice(root.length)}: unexpected MCP URL ${m[0]}`);
  }
}

// Each MCP config must declare the wavebrook server at the canonical URL.
const servers = {
  'plugins/wavebrook/.mcp.json': (j) => j.mcpServers?.wavebrook?.url,
  'plugins/wavebrook/mcp.json': (j) => j.mcpServers?.wavebrook?.url,
  'gemini-extension.json': (j) => j.mcpServers?.wavebrook?.httpUrl,
};
for (const [f, get] of Object.entries(servers)) {
  if (json[f] && get(json[f]) !== URL_) errors.push(`${f}: wavebrook server URL is ${get(json[f])}`);
}

// The install links in the README must decode to the canonical URL.
const readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const [, b64] of readme.matchAll(/name=wavebrook&config=([A-Za-z0-9+/=]+)/g)) {
  const url = JSON.parse(Buffer.from(b64, 'base64').toString()).url;
  if (url !== URL_) errors.push(`README: Cursor link decodes to ${url}`);
}
for (const [, enc] of readme.matchAll(/vscode:mcp\/install\?(\S+)/g)) {
  const url = JSON.parse(decodeURIComponent(enc)).url;
  if (url !== URL_) errors.push(`README: VS Code link decodes to ${url}`);
}

const versioned = [
  'plugins/wavebrook/.claude-plugin/plugin.json',
  'plugins/wavebrook/plugin.json',
  'gemini-extension.json',
];
const versions = new Set(versioned.map((f) => json[f]?.version));
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').match(/^## (\S+)/m)?.[1];
versions.add(changelog);
if (versions.size !== 1) errors.push(`version mismatch: ${versioned.map((f) => `${f}=${json[f]?.version}`).join(', ')}, CHANGELOG=${changelog}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: ${Object.keys(json).length} JSON files, MCP URL and version ${[...versions][0]} consistent`);
