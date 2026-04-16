#!/usr/bin/env node
/**
 * ECC Project Installer - Main Entry Point
 * Installs Everything Claude Code to project-local .claude/ directory.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const { setEccPath, createClaudeProjectAdapter } = require('./lib/claude-project');
const { loadConfig, resolveEccPath, parseCliArgs } = require('./lib/config-loader');

// Read version from package.json
const pkg = require('../package.json');
const VERSION = pkg.version || '1.0.0';

// Default ECC location (Windows)
const DEFAULT_ECC_PATH = path.join(
  os.homedir(),
  '.claude/plugins/marketplaces/everything-claude-code'
);

function cloneEccIfMissing(config, projectRoot) {
  const tmpEccDir = path.join(projectRoot, '.tmp', 'ecc-source');

  // Check if already cloned
  if (fs.existsSync(path.join(tmpEccDir, 'package.json'))) {
    console.log(`Using cached ECC at ${tmpEccDir}`);
    return tmpEccDir;
  }

  console.log(`Cloning ECC from ${config.eccGitUrl}...`);
  fs.mkdirSync(path.join(projectRoot, '.tmp'), { recursive: true });
  execSync(`git clone --depth 1 "${config.eccGitUrl}" "${tmpEccDir}"`, { stdio: 'inherit' });
  console.log('ECC cloned successfully');
  return tmpEccDir;
}

function cleanupTempEcc(projectRoot, config) {
  if (config.keepEcc) {
    console.log('Keeping temporary ECC source (--keep-ecc)');
    return;
  }
  const tmpEccDir = path.join(projectRoot, '.tmp', 'ecc-source');
  if (fs.existsSync(tmpEccDir)) {
    fs.rmSync(tmpEccDir, { recursive: true, force: true });
    console.log('Cleaned up temporary ECC source');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const projectRoot = process.cwd();

  console.log(`ECC Project Installer v${VERSION}`);
  console.log(`Target: ${projectRoot}/.claude/`);

  // 1. Load config and merge CLI args
  const fileConfig = loadConfig(projectRoot);
  const cliOverrides = parseCliArgs(args);
  const config = { ...fileConfig, ...cliOverrides };

  let eccPath = resolveEccPath(config, DEFAULT_ECC_PATH);
  let usedTempEcc = false;

  if (!fs.existsSync(eccPath)) {
    console.log(`ECC not found at ${eccPath}, will clone from GitHub...`);
    eccPath = cloneEccIfMissing(config, projectRoot);
    usedTempEcc = true;
  }

  console.log(`ECC source: ${eccPath}`);

  if (config.dryRun) {
    console.log('[DRY RUN] No changes will be made.');
  }

  // 2. Initialize adapter
  setEccPath(eccPath);
  const adapter = createClaudeProjectAdapter();

  // 3. Import ECC modules
  const { createInstallPlanFromRequest } = require(
    path.join(eccPath, 'scripts/lib/install/runtime.js')
  );
  const { applyInstallPlan } = require(
    path.join(eccPath, 'scripts/lib/install-executor.js')
  );

  // 4. Build install request
  const request = {
    mode: config.mode || 'legacy-compat',
    target: 'claude',
    legacyLanguages: config.languages || ['typescript'],
    moduleIds: [],
    includeComponentIds: [],
    excludeComponentIds: [],
  };

  // 5. Create install plan with project-local overrides
  console.log('Creating install plan...');
  const plan = createInstallPlanFromRequest(request, {
    projectRoot: projectRoot,
    homeDir: projectRoot,  // Trick: treat project as "home"
    sourceRoot: eccPath,
    claudeRulesDir: null,
  });

  // H1 fix: Validate plan object before patching
  if (!plan || typeof plan !== 'object') {
    throw new Error('Failed to create install plan - ECC returned invalid plan');
  }

  // 6. Patch plan operations for project-local paths
  patchPlanForProjectLocal(plan, projectRoot);

  if (config.dryRun) {
    console.log(`[DRY RUN] Would execute ${plan.operations?.length || 0} operations.`);
    plan.operations?.forEach((op, i) => {
      console.log(`  [${i + 1}] ${op.type || 'op'}: ${op.destinationPath || op.sourcePath || ''}`);
    });
    return;
  }

  // 7. Execute
  console.log(`Executing ${plan.operations?.length || 0} operations...`);
  await applyInstallPlan(plan);

  // 8. Fix hook paths
  if (config.autoFixHookPaths !== false) {
    fixHookPaths(projectRoot);
  }

  if (usedTempEcc) {
    cleanupTempEcc(projectRoot, config);
  }

  console.log('Installation complete!');
  console.log(`Installed to: ${projectRoot}/.claude/`);
}

function patchPlanForProjectLocal(plan, projectRoot) {
  // Override destination paths from ~/.claude to ./.claude
  if (!plan.operations) return;

  // H2 fix: Normalize paths and use startsWith for reliable matching
  const homeClaudePath = path.join(os.homedir(), '.claude');
  const projectClaudePath = path.join(projectRoot, '.claude');

  // Patch targetRoot so applyInstallPlan writes settings.json to project-local path
  if (plan.targetRoot && plan.targetRoot.startsWith(homeClaudePath)) {
    plan.targetRoot = plan.targetRoot.replace(homeClaudePath, projectClaudePath);
  }

  plan.operations.forEach(op => {
    if (op.destinationPath) {
      const normalized = path.normalize(op.destinationPath);
      if (normalized.startsWith(homeClaudePath)) {
        op.destinationPath = normalized.replace(homeClaudePath, projectClaudePath);
      }
    }
  });
}

function fixHookPaths(projectRoot) {
  const hooksFile = path.join(projectRoot, '.claude/hooks/hooks.json');
  if (!fs.existsSync(hooksFile)) return;

  try {
    // M1 fix: Parse JSON and fix paths properly instead of fragile regex
    const hooks = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));

    const fixPath = (str) => {
      if (typeof str !== 'string') return str;
      // Fix both forward and backslash variants
      return str
        .replace(/node scripts[/\\]/g, 'node .claude/scripts/')
        .replace(/^scripts[/\\]/g, '.claude/scripts/')
        .replace(/"scripts[/\\]/g, '".claude/scripts/');
    };

    const fixHookCommand = (hook) => {
      if (hook.command) hook.command = fixPath(hook.command);
      if (hook.script) hook.script = fixPath(hook.script);
      return hook;
    };

    // Fix all hook arrays
    ['preToolUse', 'postToolUse', 'preSession', 'postSession', 'userPromptSubmit'].forEach(key => {
      if (Array.isArray(hooks[key])) {
        hooks[key] = hooks[key].map(fixHookCommand);
      }
    });

    fs.writeFileSync(hooksFile, JSON.stringify(hooks, null, 2), 'utf8');
    console.log('Fixed hook paths in hooks.json');
  } catch (err) {
    console.warn(`Warning: Could not fix hook paths: ${err.message}`);
  }
}

main().catch(err => {
  console.error('Installation failed:', err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
