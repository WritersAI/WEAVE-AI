#!/usr/bin/env node
// Usage: node scripts/init-target.mjs <name> <vault-path>
// Adds target to .targets/targets.yaml and creates the plugin directory

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const configPath = resolve(rootDir, '.targets/targets.yaml');

const [,, name, vaultPath] = process.argv;

if (!name || !vaultPath) {
  console.error('Usage: node scripts/init-target.mjs <name> <vault-path>');
  console.error('Example: node scripts/init-target.mjs woods /Users/ross/projects/woods-project');
  process.exit(1);
}

// Compute plugin path
const pluginPath = resolve(vaultPath.replace(/^~/, process.env.HOME), '.obsidian/plugins/weave-ai');

// Load or create config
let config = { targets: {}, default: null };
if (existsSync(configPath)) {
  config = parseYaml(readFileSync(configPath, 'utf8'));
}

// Add target
config.targets[name] = pluginPath;

// Set as default if first target
if (!config.default) {
  config.default = name;
}

// Ensure .targets directory exists
mkdirSync(resolve(rootDir, '.targets'), { recursive: true });

// Write config
writeFileSync(configPath, stringifyYaml(config));

// Create plugin directory
mkdirSync(pluginPath, { recursive: true });

// Create .hotreload file for Obsidian hot-reload
writeFileSync(resolve(pluginPath, '.hotreload'), '');

console.log(`✓ Added target "${name}": ${pluginPath}`);
console.log(`✓ Created plugin directory with .hotreload`);
if (Object.keys(config.targets).length === 1) {
  console.log(`✓ Set "${name}" as default target`);
}
