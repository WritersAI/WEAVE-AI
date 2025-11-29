OK we're going to make a slight change to this directory and to the instructions that are listed in .this file below the EXTERNAL_PLAN H1.

There will be .targets/ directory which will contain subfolders which are the "build targets" - These directories will be sym-linked in two specific directories which are serving as Obsidian vaults.  Each of those will have its own data.json Et cetera, which should not be modified as part of the deploy process.  The mapping of vault to build target will be tracked in a targets.yaml file in the .targets/ directory. In that file the name of the target subdirectory and the absolute path of the vault will be stored. When setting up a new build target, the process of building the sym-link should be automated. 

So for example;
- .targets/vault.memex will be sym-linked to the plugins subdirectory in the ~/memex vault (be careful with this one, I will manually do this symlink because the directory itself is a sym-link)
- .targets/vault.cwr --> /Users/ross/projects/cwr-novel (appropriate plugins directory)
- .targets/vault.woods --> /Users/ross/projects/woods-project

The .targets/targets.yml the file should contain all of these mappings, in the process of adding a new Vault, should be just adding the local target name and the destination Vault location to the YAML file and then running a command line utility update. At that point a `build all` or similar command to whatever the packaging solution is should continuously build to all of the enumerated locations. This may be related to the `npm run dev` but maybe we have to do a little extra work or modify some scripts to be able to have it build only to a single location, a selection of locations, or all locations. 


# EXTERNAL_PLAN
Minimal deploy script approach:

  my-obsidian-plugin/
  ├── src/
  ├── manifest.json
  ├── package.json
  ├── esbuild.config.mjs
  ├── deploy.config.json      # gitignored
  └── scripts/
      └── deploy.js

  deploy.config.json (gitignored, machine-specific):
  {
    "targets": {
      "vault-a": "/Users/ross/Documents/VaultA/.obsidian/plugins/my-plugin",
      "vault-b": "/Users/ross/Documents/VaultB/.obsidian/plugins/my-plugin"
    },
    "default": "vault-a"
  }

  scripts/deploy.js:
  import { execSync } from 'child_process';
  import { cpSync, mkdirSync } from 'fs';
  import { resolve } from 'path';
  import config from '../deploy.config.json' assert { type: 'json' };

  const target = process.argv[2] || config.default;
  const destPath = config.targets[target];

  if (!destPath) {
    console.error(`Unknown target: ${target}. Available: ${Object.keys(config.targets).join(', ')}`);
    process.exit(1);
  }

  // Build
  execSync('npm run build', { stdio: 'inherit' });

  // Deploy
  mkdirSync(destPath, { recursive: true });
  ['main.js', 'manifest.json', 'styles.css'].forEach(file => {
    try {
      cpSync(resolve(file), resolve(destPath, file));
    } catch (e) {
      if (file !== 'styles.css') throw e; // styles.css optional
    }
  });

  console.log(`Deployed to ${target}: ${destPath}`);

  package.json scripts:
  {
    "scripts": {
      "build": "esbuild src/main.ts --bundle --outfile=main.js --external:obsidian --format=cjs",
      "deploy": "node scripts/deploy.js",
      "deploy:a": "node scripts/deploy.js vault-a",
      "deploy:b": "node scripts/deploy.js vault-b",
      "dev": "node scripts/deploy.js --watch"
    }
  }

  For watch mode, add to deploy.js:
  if (process.argv.includes('--watch')) {
    execSync(`npm run build -- --watch`, {
      stdio: 'inherit',
      // Use chokidar or esbuild's onRebuild to trigger copy
    });
  }

  That's it. One plugin, multiple deploy targets, no mono-repo overhead. The config file keeps vault paths
  out of version control, and you can deploy different branches to different vaults by switching branches
  and running deploy:a vs deploy:b.