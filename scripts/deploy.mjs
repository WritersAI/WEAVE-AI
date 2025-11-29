#!/usr/bin/env node
import { readFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const targetArg = args.find(a => !a.startsWith('--'));
const watchMode = args.includes('--watch');
const allTargets = args.includes('--all');

// Load config
const configPath = resolve(rootDir, '.targets/targets.yaml');

// Check if config exists
if (!existsSync(configPath)) {
  console.log('No deploy targets configured.');
  console.log('Add a target with: npm run target:add <name> <vault-path>');
  console.log('Example: npm run target:add woods /Users/ross/projects/woods-project');
  process.exit(0); // Exit cleanly, not an error
}

const config = parseYaml(readFileSync(configPath, 'utf8'));
const { targets, default: defaultTarget } = config;

// Check if any targets exist
if (!targets || Object.keys(targets).length === 0) {
  console.log('No deploy targets configured.');
  console.log('Add a target with: npm run target:add <name> <vault-path>');
  process.exit(0);
}

// Determine which targets to deploy to
let deployTargets;
if (allTargets) {
  deployTargets = Object.entries(targets);
} else if (targetArg) {
  if (!targets[targetArg]) {
    console.error(`Unknown target: ${targetArg}. Available: ${Object.keys(targets).join(', ')}`);
    process.exit(1);
  }
  deployTargets = [[targetArg, targets[targetArg]]];
} else if (defaultTarget && targets[defaultTarget]) {
  deployTargets = [[defaultTarget, targets[defaultTarget]]];
} else {
  console.log('No default target set. Use --all or specify a target name.');
  console.log(`Available targets: ${Object.keys(targets).join(', ')}`);
  process.exit(0);
}

// Files to deploy
const files = ['main.js', 'styles.css', 'manifest.json'];

// Deploy function
function deploy() {
  if (deployTargets.length === 0) return;

  for (const [name, path] of deployTargets) {
    const destPath = path.replace(/^~/, process.env.HOME);
    mkdirSync(destPath, { recursive: true });

    for (const file of files) {
      const src = resolve(rootDir, file);
      if (existsSync(src)) {
        copyFileSync(src, resolve(destPath, file));
      }
    }
    console.log(`✓ Deployed to ${name}: ${destPath}`);
  }
}

// Export for use by esbuild plugin
export { deploy, watchMode };

// Run if called directly
if (!watchMode) {
  deploy();
}
