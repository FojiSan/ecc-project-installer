/**
 * Custom adapter for project-local Claude Code installation.
 * Mirrors claude-home but uses kind: 'project' for local install.
 */

const path = require('path');

// ECC path - will be resolved at runtime
let ECC_PATH = null;

function setEccPath(eccPath) {
  ECC_PATH = eccPath;
}

function getEccPath() {
  if (!ECC_PATH) {
    throw new Error('ECC path not set. Call setEccPath() first.');
  }
  return ECC_PATH;
}

function getHelpers() {
  const eccPath = getEccPath();
  return require(path.join(eccPath, 'scripts/lib/install-targets/helpers.js'));
}

/**
 * Creates the claude-project adapter.
 * Must be called after setEccPath().
 */
function createClaudeProjectAdapter() {
  const { createInstallTargetAdapter } = getHelpers();

  return createInstallTargetAdapter({
    id: 'claude-project',
    target: 'claude',
    kind: 'project',  // Key difference from claude-home
    rootSegments: ['.claude'],
    installStatePathSegments: ['ecc', 'install-state.json'],
    nativeRootRelativePath: '.claude-plugin',
  });
}

module.exports = {
  setEccPath,
  getEccPath,
  createClaudeProjectAdapter,
};
