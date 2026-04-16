/**
 * Configuration loader for ECC Project Installer.
 * Supports config.json in project root or installer directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILENAME = 'ecc-local.config.json';

const DEFAULT_CONFIG = {
  eccPath: null,  // Auto-detect
  eccGitUrl: 'https://github.com/affaan-m/everything-claude-code.git',
  keepEcc: false,  // If true, don't cleanup temp clone
  mode: 'legacy',
  languages: ['typescript'],
  // TODO: L1 - modules filtering not yet implemented, reserved for future use
  modules: {
    agents: true,
    rules: true,
    skills: true,
    commands: true,
    hooks: true,
  },
  autoFixHookPaths: true,
  createSettings: true,
};

/**
 * Load config from project root or installer directory.
 * @param {string} projectRoot - Target project directory
 * @returns {object} Merged config
 */
function loadConfig(projectRoot) {
  // M2 fix: Primary config file should fail explicitly if invalid
  const primaryConfig = path.join(projectRoot, CONFIG_FILENAME);
  const fallbackPaths = [
    path.join(projectRoot, 'config.json'),
    path.join(__dirname, '../../config.json'),
  ];

  // Check primary config first - fail if exists but invalid
  if (fs.existsSync(primaryConfig)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(primaryConfig, 'utf8'));
      console.log(`Loaded config: ${primaryConfig}`);
      return mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch (err) {
      throw new Error(`Invalid primary config at ${primaryConfig}: ${err.message}`);
    }
  }

  // Fallback configs can warn and continue
  for (const configPath of fallbackPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`Loaded config: ${configPath}`);
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (err) {
        console.warn(`Warning: Invalid config at ${configPath}: ${err.message}`);
      }
    }
  }

  console.log('Using default config');
  return { ...DEFAULT_CONFIG };
}

/**
 * Deep merge user config into defaults.
 */
function mergeConfig(defaults, user) {
  const result = { ...defaults };

  for (const key of Object.keys(user)) {
    if (user[key] !== null && typeof user[key] === 'object' && !Array.isArray(user[key])) {
      result[key] = mergeConfig(defaults[key] || {}, user[key]);
    } else {
      result[key] = user[key];
    }
  }

  return result;
}

/**
 * Resolve ECC installation path.
 * @param {object} config - User config
 * @param {string} defaultPath - Fallback path
 * @returns {string} Resolved ECC path
 */
function resolveEccPath(config, defaultPath) {
  if (config.eccPath) {
    return path.resolve(config.eccPath);
  }

  // Try environment variable
  if (process.env.ECC_PATH) {
    return path.resolve(process.env.ECC_PATH);
  }

  // Try common locations
  const commonPaths = [
    defaultPath,
    path.join(os.homedir(), '.claude/plugins/marketplaces/everything-claude-code'),
    path.join(os.homedir(), 'everything-claude-code'),
  ];

  for (const eccPath of commonPaths) {
    if (fs.existsSync(path.join(eccPath, 'package.json'))) {
      return eccPath;
    }
  }

  return defaultPath;
}

/**
 * Parse CLI arguments into config overrides.
 */
function parseCliArgs(args) {
  const overrides = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--languages' && args[i + 1]) {
      overrides.languages = args[++i].split(',').map(s => s.trim());
    } else if (arg === '--ecc-path' && args[i + 1]) {
      // L2 fix: Basic path sanitization
      const eccPath = args[++i];
      if (!eccPath || eccPath.startsWith('-')) {
        throw new Error('Invalid --ecc-path value');
      }
      overrides.eccPath = path.resolve(eccPath);
    } else if (arg === '--keep-ecc') {
      overrides.keepEcc = true;
    } else if (arg === '--dry-run') {
      overrides.dryRun = true;
    } else if (arg === '--mode' && args[i + 1]) {
      overrides.mode = args[++i];
    }
  }

  return overrides;
}

module.exports = {
  loadConfig,
  resolveEccPath,
  parseCliArgs,
  DEFAULT_CONFIG,
};
