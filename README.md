# ECC Project Installer

Non-invasive project-local installer for [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code).

## Problem

ECC's official installer only supports global installation to `~/.claude/`. This wrapper enables **project-local** installation to `./.claude/` without modifying the original ECC codebase.

## Features

- Project-local installation (`./.claude/`)
- Language selection (TypeScript, Python, Go, etc.)
- Auto-fixes hook paths for local context
- Creates project-local settings.json
- Non-invasive: ECC repo remains untouched

## Requirements

- Node.js 18+
- ECC installed (default: `~/.claude/plugins/marketplaces/everything-claude-code`)
- PowerShell 5.1+ (Windows)

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/ecc-project-installer.git
```

## Usage

### Windows (PowerShell)

```powershell
# From your project directory
C:\path\to\ecc-project-installer\install-local.ps1

# With options
.\install-local.ps1 -Languages "typescript,python"
.\install-local.ps1 -DryRun
.\install-local.ps1 -EccPath "D:\custom\ecc"
```

### Configuration

Create `ecc-local.config.json` in your project root:

```json
{
  "languages": ["typescript", "python"],
  "modules": {
    "agents": true,
    "rules": true,
    "skills": true,
    "commands": false,
    "hooks": true
  }
}
```

### Auto-Clone Fallback

If ECC is not installed locally, the installer will automatically clone it from GitHub:

- Default source: `https://github.com/affaan-m/everything-claude-code.git`
- Clone location: `./.tmp/ecc-source` (auto-deleted after install)
- Keep clone: Use `--keep-ecc` flag or `"keepEcc": true` in config

## How It Works

1. Creates a custom `claude-project` adapter with `kind: 'project'`
2. Calls ECC's internal APIs with `projectRoot` override
3. Patches destination paths from `~/.claude/` to `./.claude/`
4. Fixes hook script paths in `hooks.json`
5. Creates local `settings.json` referencing project hooks

## Project Structure After Install

```
your-project/
├── .claude/
│   ├── agents/          # 48 agent definitions
│   ├── rules/
│   │   ├── common/      # Common rules
│   │   └── typescript/  # Language-specific rules
│   ├── skills/          # Workflow definitions
│   ├── commands/        # Slash commands
│   ├── hooks/
│   │   └── hooks.json   # Hook config (paths fixed)
│   ├── scripts/
│   │   ├── hooks/       # Hook implementations
│   │   └── lib/         # Shared utilities
│   ├── settings.json    # Local settings
│   └── ecc/
│       └── install-state.json
└── CLAUDE.md            # (optional) copied from ECC
```

## Compatibility

See [COMPATIBILITY.md](COMPATIBILITY.md) for tested ECC versions.

## License

MIT
