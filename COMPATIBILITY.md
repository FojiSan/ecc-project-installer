# Compatibility

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Windows (PowerShell 5.1+) | Supported | Tested and verified; ASCII-only output (no Unicode/em-dashes) |
| Windows (PowerShell Core 7+) | Supported | Cross-platform via pwsh |
| macOS / Linux (PowerShell Core 7+) | Portable | Run with `pwsh install-ecc-baseline.ps1` |

## Requirements

| Requirement | Minimum Version | Required When | Notes |
|-------------|-----------------|---------------|-------|
| PowerShell | 5.1 | Always | Windows built-in; or install PowerShell Core 7+ |
| Git | Any recent | Auto-clone only | Only needed when `-SourcePath` is not provided |
| ECC Source | Latest | Manual install only | Must have valid `agents/` directory |

## ECC Directory Structure

The installer expects the ECC source to contain:

```
everything-claude-code/
├── agents/               # *.md files (required for validation)
├── rules/                # Subdirectories for rules
├── .agents/
│   └── skills/           # Primary skills path
├── skills/               # Secondary skills path
├── commands/             # *.md command files
├── hooks/
│   └── hooks.json
└── mcp-configs/
    └── mcp-servers.json
```

The `agents/` directory is used as the validity check. If it is missing, the script exits with an error.

## PowerShell 5.1 Compatibility Notes

The script is written to be compatible with PowerShell 5.1 (Windows):

- Output uses ASCII characters only (no em-dashes, no Unicode symbols)
- JSON operations use `ConvertFrom-Json` / `ConvertTo-Json` with `-Depth 20`
- File writes use `-Encoding UTF8` to avoid BOM issues on older PS versions
- No use of PS 6+ features (null-coalescing operator `??`, ternary, etc.)

## Known Limitations

- JSON merge uses PowerShell's `ConvertFrom-Json` / `ConvertTo-Json`; deeply nested objects are supported up to depth 20
- No validation of MCP server placeholder values — must edit `settings.json` manually after install
- `git clone --depth 1` is used for auto-clone; full history is not available in the cached copy
- Cache reuse checks for `agents/` folder only; partial or corrupted clones must be cleared manually

## Known Issues

- None yet

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `git is not available on PATH` | Git not installed or not on PATH | Install Git or supply `-SourcePath` manually |
| `ECC source not found` | Invalid `-SourcePath` value | Verify path points to a valid ECC repository |
| `Not a valid ECC repo (missing agents/ dir)` | Source lacks `agents/` directory | Confirm you are pointing at the ECC root |
| `Target project directory not found` | `-TargetPath` does not exist | Create the target directory before running |
| `git clone failed` | Network issue or bad URL | Check internet connection and `-EccGitUrl` value |
| Stale or incomplete cached clone | `.tmp/ecc-source/` is corrupted | Delete `.tmp/` folder and re-run to force fresh download |
| `Permission denied` | Insufficient write access | Run PowerShell as Administrator |
| `settings.json` merge errors | Malformed existing `settings.json` | Validate JSON before re-running; fix syntax errors first |
