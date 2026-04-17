# ECC Baseline Installer

Simple project-local installer for [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code).

## Purpose

Copies all ECC components (agents, rules, skills, commands, hooks, MCP configs) into your project's `.claude/` directory for project-local use. Deduplicates hooks and MCP server configurations automatically.

## Quick Start

```powershell
.\install-ecc-baseline.ps1 -SourcePath "C:\path\to\everything-claude-code" -TargetPath ".\"
```

Or, if `ECC_SOURCE` environment variable is set:

```powershell
.\install-ecc-baseline.ps1 -TargetPath ".\"
```

The script will prompt for SourcePath if not provided.

## What Gets Installed

Into your project's `.claude/` directory:

- `agents/*.md` — All agent definitions
- `rules/**/*` — All rule subdirectories (common, language-specific, etc.)
- `skills/**/*` — Workflow and skill definitions
- `commands/*.md` — Slash command definitions
- `hooks.json` → merged into `settings.json` (deduplicates by id)
- `mcp-servers.json` → merged into `settings.json` (skips existing servers)

## Requirements

- PowerShell 5.1+ (Windows)
- Access to ECC source directory (either local or clone it first)
- Target project directory must exist

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
