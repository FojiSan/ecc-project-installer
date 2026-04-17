# ECC Baseline Installer

Simple project-local installer for [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code).

## Purpose

Copies all ECC components (agents, rules, skills, commands, hooks, MCP configs) into your project's `.claude/` directory for project-local use. Deduplicates hooks and MCP server configurations automatically.

## Quick Start

**Auto-clone from GitHub (no local ECC copy needed):**

```powershell
.\install-ecc-baseline.ps1 -TargetPath "C:\path\to\my-project"
```

**From a local ECC copy:**

```powershell
.\install-ecc-baseline.ps1 -SourcePath "C:\path\to\everything-claude-code" -TargetPath "C:\path\to\my-project"
```

**Install into current directory:**

```powershell
.\install-ecc-baseline.ps1
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `-SourcePath` | string | `$env:ECC_SOURCE` | Path to local ECC source. If omitted, clones from GitHub automatically. |
| `-TargetPath` | string | Current directory | Target project directory where `.claude/` will be created. |
| `-EccGitUrl` | string | `https://github.com/affaan-m/everything-claude-code.git` | Custom ECC repository URL for cloning. |
| `-KeepClone` | switch | false | Keep the cloned ECC source in `.tmp/ecc-source/` after install. |

## Auto-Clone Behavior

When `-SourcePath` is not provided, the script clones ECC from GitHub automatically:

1. Checks for a cached clone at `$TargetPath\.tmp\ecc-source\`
2. If the cache exists and has a valid `agents/` folder, reuses it (no download)
3. If no cache, clones from `$EccGitUrl` using `git clone --depth 1`
4. After install, removes the `.tmp\` folder unless `-KeepClone` is set

**To force a fresh download:** delete the `.tmp\` folder and re-run the script.

## Usage Examples

```powershell
# Minimal: auto-clone, install into current directory
.\install-ecc-baseline.ps1

# Auto-clone into a specific project
.\install-ecc-baseline.ps1 -TargetPath "C:\projects\my-app"

# Auto-clone, keep the local copy for reuse
.\install-ecc-baseline.ps1 -TargetPath "C:\projects\my-app" -KeepClone

# From a local ECC source
.\install-ecc-baseline.ps1 -SourcePath "C:\tools\everything-claude-code" -TargetPath "C:\projects\my-app"

# Custom fork or mirror
.\install-ecc-baseline.ps1 -EccGitUrl "https://github.com/my-org/ecc-fork.git" -TargetPath "C:\projects\my-app"
```

## What Gets Installed

Into your project's `.claude/` directory:

| Source | Destination | Notes |
|--------|-------------|-------|
| `agents/*.md` | `.claude/agents/` | All agent definitions |
| `rules/**/*` | `.claude/rules/` | All rule subdirectories |
| `.agents/skills/*` | `.claude/skills/` | Primary skills path |
| `skills/*` | `.claude/skills/` | Secondary skills path (merged) |
| `commands/*.md` | `.claude/commands/` | Slash command definitions |
| `hooks/hooks.json` | `.claude/settings.json` | Merged; deduplicates by `id` |
| `mcp-configs/mcp-servers.json` | `.claude/settings.json` | Merged; skips existing servers |

## Requirements

- PowerShell 5.1+ (Windows) or PowerShell Core (cross-platform)
- Git — only required when cloning from GitHub (i.e., `-SourcePath` is not provided)
- Target project directory must exist before running

**Note:** No Node.js dependency — this is a pure PowerShell installer.

## Project Structure After Install

```
your-project/
└── .claude/
    ├── agents/           # Agent definitions
    ├── rules/            # All rule subdirectories
    ├── skills/           # Skill definitions
    ├── commands/         # Slash command definitions
    └── settings.json     # Merged hooks + MCP configs
```

## Post-Installation

Edit `.claude/settings.json` and replace any `YOUR_*_HERE` placeholders with real API keys for MCP servers.

## Archived Implementation

The `archived/` directory contains a previous complex implementation with language selection and configuration files. The baseline installer is simpler and installs everything.

## Compatibility

See [COMPATIBILITY.md](COMPATIBILITY.md) for platform and version requirements.

## License

MIT
